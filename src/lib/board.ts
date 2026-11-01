import "server-only";

import { supabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { LeaderboardRow, PublicProfile } from "@/lib/types";

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("leaderboard");
    if (error) {
      console.error("[board] leaderboard failed", error.message);
      return [];
    }
    return (data ?? []) as LeaderboardRow[];
  } catch (error) {
    console.error("[board] leaderboard failed", error);
    return [];
  }
}

export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("public_profile", { p_handle: handle });
    if (error) {
      console.error("[board] public_profile failed", error.message);
      return null;
    }
    return (data as PublicProfile | null) ?? null;
  } catch (error) {
    console.error("[board] public_profile failed", error);
    return null;
  }
}
