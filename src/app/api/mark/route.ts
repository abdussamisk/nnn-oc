import { NextResponse } from "next/server";

import { rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function currentSession() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null };
}

function serverError() {
  return NextResponse.json(
    { error: "The challenge server is unreachable. Try again." },
    { status: 500 },
  );
}

export async function POST() {
  try {
    const { supabase, user } = await currentSession();
    if (!user) {
      return NextResponse.json({ error: "Sign in again to mark today." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("mark_today");
    if (error) {
      return NextResponse.json({ error: rpcErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json(
      { state: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return serverError();
  }
}

export async function DELETE() {
  try {
    const { supabase, user } = await currentSession();
    if (!user) {
      return NextResponse.json({ error: "Sign in again to undo today." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("unmark_today");
    if (error) {
      return NextResponse.json({ error: rpcErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json(
      { state: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return serverError();
  }
}
