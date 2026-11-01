import { NextResponse } from "next/server";

import { getClipForDay } from "@/lib/clips";
import { rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Sign in to load today's clip." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("dashboard_state");
    if (error) {
      return NextResponse.json({ error: rpcErrorMessage(error) }, { status: 400 });
    }

    const state = data as DashboardState;
    const clip =
      state.phase === "open" && state.today_day
        ? await getClipForDay(state.today_day, 4 * 60 * 60)
        : null;

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
