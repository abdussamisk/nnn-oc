import { NextResponse } from "next/server";

import { getClipForDay } from "@/lib/clips";
import { rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ day: string }> }) {
  const { day: rawDay } = await context.params;
  const day = Number(rawDay);

  if (!Number.isInteger(day) || day < 1 || day > 30) {
    return NextResponse.json({ error: "That day doesn't exist." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Sign in to load clips." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("dashboard_state");
    if (error) {
      return NextResponse.json({ error: rpcErrorMessage(error) }, { status: 400 });
    }

    const state = data as DashboardState;
    const isMarked = state.marked_days.includes(day);
    const isToday = state.phase === "open" && state.today_day === day;

    if (!isMarked && !isToday) {
      return NextResponse.json(
        { error: "Clips are only available for days you marked, or today." },
        { status: 403 },
      );
    }

    const clip = await getClipForDay(day, 60 * 60);
    if (!clip) {
      return NextResponse.json(
        { error: "That clip hasn't been uploaded yet." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { clip },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The challenge server is unreachable. Try again." },
      { status: 500 },
    );
  }
}
