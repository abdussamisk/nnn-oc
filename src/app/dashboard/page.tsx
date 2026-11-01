import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { getAuthUser } from "@/lib/auth";
import { getClipForDay } from "@/lib/clips";
import { isProfileMissing, rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardState } from "@/lib/types";

import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Your November",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("dashboard_state");

  if (error) {
    if (isProfileMissing(error)) redirect("/onboarding");

    return (
      <main className="shell flex min-h-screen flex-col items-center justify-center py-16 text-center">
        <div className="eyebrow">Dashboard unavailable</div>
        <h1 className="display mt-4 text-5xl text-bone">Something went sideways.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-bone-dim">{rpcErrorMessage(error)}</p>
        <div className="mt-7 flex gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Try again
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const state = data as DashboardState;
  const todayClip =
    state.phase === "open" && state.today_day
      ? await getClipForDay(state.today_day, 4 * 60 * 60)
      : null;

  return (
    <>
      <DashboardView
        initialState={state}
        initialClip={todayClip}
        clipFetchedAt={state.server_now}
      />
      <SiteFooter />
    </>
  );
}
