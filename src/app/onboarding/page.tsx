import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Set up your handle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/onboarding");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f3ede2 1px, transparent 1px), linear-gradient(to bottom, #f3ede2 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
      <div className="shell relative flex min-h-screen flex-col">
        <header className="flex h-20 items-center justify-between">
          <Logo />
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-[12px] font-semibold text-bone-dim hover:text-bone">
              Use a different account
            </button>
          </form>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1fr_460px] lg:gap-24">
          <div className="hidden lg:block">
            <div className="eyebrow">Setup · 1 of 1</div>
            <h1 className="display mt-6 max-w-2xl text-[clamp(4.5rem,8vw,7.5rem)] text-bone">
              Choose the name
              <br />
              <span className="text-ember">they&apos;ll remember.</span>
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-bone-dim">
              This handle is your entire public identity. No real name. No email. No avatar. Just
              a name and a record of whether you showed up.
            </p>

            <div className="mt-10 max-w-md border-t border-line pt-6">
              <div className="flex items-start gap-3">
                <span className="mt-1 font-mono text-[10px] text-ember">01</span>
                <div>
                  <div className="text-sm font-bold text-bone">Your timezone is the clock</div>
                  <p className="mt-1 text-[12px] leading-5 text-muted">
                    We use it server-side. Changing zones takes effect at the new zone&apos;s next
                    midnight, not instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-rise">
            <div className="card p-6 sm:p-8">
              <div className="eyebrow">One-time setup</div>
              <h2 className="display mt-3 text-4xl text-bone">Make it yours.</h2>
              <p className="mt-3 text-sm leading-6 text-bone-dim">
                You can&apos;t change this later, so pick something you can live with for 30 days.
              </p>
              <div className="mt-7">
                <OnboardingForm defaultTimezone="UTC" />
              </div>
            </div>

            <p className="mt-5 text-center font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
              Signed in as a private Google account
            </p>
            <p className="mt-2 text-center text-[11px] text-muted">
              <Link href="/" className="link-underline">
                Back to the challenge
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
