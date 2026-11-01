import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { PhaseBadge } from "@/components/phase-badge";
import { phaseForUtcDate } from "@/lib/challenge";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERROR_COPY: Record<string, string> = {
  oauth: "Google sign-in didn't start. Try again.",
  callback: "That sign-in link expired. Try again.",
  missing: "Sign in to continue.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = params.error ? ERROR_COPY[params.error] ?? "Sign-in failed. Try again." : null;
  const configured = supabaseConfigured();

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
          <Link href="/leaderboard" className="text-[12px] font-semibold text-bone-dim hover:text-bone">
            View the board
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-14 py-10 lg:grid-cols-[1fr_440px] lg:gap-24">
          <div className="hidden lg:block">
            <PhaseBadge phase={phaseForUtcDate()} />
            <h1 className="display mt-7 max-w-2xl text-[clamp(4.5rem,8vw,7.5rem)] text-bone">
              Your name on the board.
              <br />
              <span className="text-ember">Nothing else.</span>
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-bone-dim">
              We use Google to prove you&apos;re a person. We never show your email, real name, or
              profile photo. The board only knows your handle.
            </p>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-7">
              <div>
                <div className="display text-3xl text-bone">30</div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                  days
                </div>
              </div>
              <div>
                <div className="display text-3xl text-bone">1</div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                  mark a day
                </div>
              </div>
              <div>
                <div className="display text-3xl text-ember">0</div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                  do-overs
                </div>
              </div>
            </div>
          </div>

          <div className="animate-rise">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <PhaseBadge phase={phaseForUtcDate()} />
              <span className="eyebrow">Nov 2026</span>
            </div>

            <div className="card p-6 sm:p-8">
              <div className="eyebrow">Sign in</div>
              <h2 className="display mt-3 text-4xl text-bone">Take your place.</h2>
              <p className="mt-3 text-sm leading-6 text-bone-dim">
                One Google account. One handle. One decision a day.
              </p>

              {error ? (
                <div className="mt-6 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-[13px] text-ember-soft">
                  {error}
                </div>
              ) : null}

              {!configured ? (
                <div className="mt-6 rounded-xl border border-line-strong bg-ink-3/60 px-4 py-3 text-[12px] leading-5 text-bone-dim">
                  Supabase isn&apos;t configured in this environment yet. Add the keys from{" "}
                  <code className="font-mono text-bone">.env.example</code> to enable sign-in.
                </div>
              ) : null}

              <Link
                href={`/api/auth/login?next=${encodeURIComponent(next)}`}
                className={`btn btn-primary mt-7 w-full !min-h-12 ${!configured ? "pointer-events-none opacity-50" : ""}`}
                aria-disabled={!configured}
              >
                <GoogleMark />
                Continue with Google
              </Link>

              <div className="mt-5 flex items-start gap-3 border-t border-line pt-5">
                <span className="mt-0.5 text-ember" aria-hidden="true">
                  ◇
                </span>
                <p className="text-[11px] leading-5 text-muted">
                  By continuing you agree to keep it civil and to let your handle appear on the
                  public board. Your email stays private.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
              November 1–30, 2026 · Read-only after Nov 30
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="currentColor"
        opacity=".8"
        d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="currentColor"
        opacity=".6"
        d="M3.963 10.707A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z"
      />
      <path
        fill="currentColor"
        opacity=".4"
        d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.58C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
