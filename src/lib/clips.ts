import "server-only";

import { adminConfigured, clipsBucket } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Clip } from "@/lib/types";

const CLIP_PATTERN = /^day-(\d{2})\.(mp4|webm|gif)$/i;
const EXTENSION_RANK: Record<string, number> = { mp4: 0, webm: 1, gif: 2 };

type ClipEntry = {
  day: number;
  path: string;
  extension: "mp4" | "webm" | "gif";
};

type ListingCache = {
  expiresAt: number;
  entries: ClipEntry[];
};

let listingCache: ListingCache | null = null;

async function listClipFiles(): Promise<ClipEntry[]> {
  if (listingCache && Date.now() < listingCache.expiresAt) {
    return listingCache.entries;
  }

  if (!adminConfigured()) return [];

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(clipsBucket()).list("", {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error("[clips] list failed", error.message);
      return [];
    }

    const byDay = new Map<number, ClipEntry>();
    for (const item of data ?? []) {
      const match = CLIP_PATTERN.exec(item.name);
      if (!match) continue;
      const day = Number(match[1]);
      const extension = match[2].toLowerCase() as ClipEntry["extension"];
      if (day < 1 || day > 30) continue;

      const current = byDay.get(day);
      if (!current || EXTENSION_RANK[extension] < EXTENSION_RANK[current.extension]) {
        byDay.set(day, { day, path: item.name, extension });
      }
    }

    const entries = [...byDay.values()].sort((a, b) => a.day - b.day);
    listingCache = { entries, expiresAt: Date.now() + 60_000 };
    return entries;
  } catch (error) {
    console.error("[clips] list failed", error);
    return [];
  }
}

export async function getClipForDay(day: number, ttlSeconds: number): Promise<Clip | null> {
  const entries = await listClipFiles();
  const entry = entries.find((candidate) => candidate.day === day);
  if (!entry) return null;

  if (!adminConfigured()) return null;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage
      .from(clipsBucket())
      .createSignedUrl(entry.path, ttlSeconds);

    if (error || !data?.signedUrl) {
      if (error) console.error("[clips] sign failed", error.message);
      return null;
    }

    return {
      day,
      url: data.signedUrl,
      kind: entry.extension === "gif" ? "image" : "video",
      filename: entry.path,
    };
  } catch (error) {
    console.error("[clips] sign failed", error);
    return null;
  }
}

export async function hasClipForDay(day: number): Promise<boolean> {
  const entries = await listClipFiles();
  return entries.some((entry) => entry.day === day);
}

export function invalidateClipCache() {
  listingCache = null;
}
