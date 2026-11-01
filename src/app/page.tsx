import Link from "next/link";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { PhaseBadge } from "@/components/phase-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stat } from "@/components/stat";
import { getLeaderboard } from "@/lib/board";
import { phaseForUtcDate } from "@/lib/challenge";
import { pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

const RULES = [
  {
    number: "01",
    title: "One mark a day",
    body: "Day N is November N. Marking opens at your local midnight and closes at the next one.",
  },
  {
    number: "02",
    title: "A miss resets the run",
    body: "Your current streak goes back to zero. Your best streak stays on the board forever.",
  },
  {
    number: "03",
    title: "Late joiners are excused",
    body: "Days before your first local challenge date neither count nor break anything. Start where you are.",
  },
  {
    number: "04",
    title: "Today only",
    body: "No backfill. Yesterday is immutable the moment your local midnight passes.",
  },
  {
    number: "05",
    title: "Your midnight decides",
    body: "The server reads your timezone. Browser clocks don't count. A timezone change waits for the new zone's next midnight.",
  },
  {
    number: "06",
    title: "Public board, private inbox",
    body: "Your handle is public. Your real name, email, and Google avatar never appear on the board.",
  },
];

function PerfectMonth() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-ember/10 blur-3xl" aria-hidden="true" />
      <div className="card rotate-[1.2deg] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">The perfect month</div>
            <div className="mt-2 font-serif text-2xl text-bone">Nothing missed.</div>
          </div>
          <div className="text-right">
            <div className="display text-4xl text-live">30</div>
            <div className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">for 30</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-1.5" aria-hidden="true">
          {Array.from({ length: 30 }, (_, index) => {
            const day = index + 1;
            return (
              <div
                key={day}
                className={`flex aspect-square items-center justify-center rounded-md border font-mono text-[10px] font-medium ${
                  day === 30
                    ? "border-live bg-live text-[#101502]"
                    : "border-ember/40 bg-ember text-[#1a0803]"
                }`}
                style={{ opacity: 0.72 + (day / 30) * 0.28 }}
              >
                {String(day).padStart(2, "0")}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
          <span>Nov 01</span>
          <span className="text-ember">Current streak: 30</span>
          <span>Nov 30</span>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const rows = await getLeaderboard();
  const phase = phaseForUtcDate();
  const participants = rows.length;
  const totalMarks = rows.reduce((sum, row) => sum + row.days_marked, 0);
  const topBest = rows[0]?.best_streak ?? 0;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #f3ede2 1px, transparent 1px), linear-gradient(to bottom, #f3ede2 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
            aria-hidden="true"
          />
          <div className="shell relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.18fr_0.82fr] lg:gap-16 lg:py-28">
            <div className="animate-rise">
              <div className="flex flex-wrap items-center gap-3">
                <PhaseBadge phase={phase} />
                <span className="eyebrow">Nov 1–30, 2026</span>
              </div>

              <h1 className="display mt-7 text-[clamp(4.2rem,11.5vw,9rem)] text-bone">
                Thirty days.
                <br />
                <span className="text-ember">One</span> decision.
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-bone-dim sm:text-lg">
                Mark today. That&apos;s the whole ritual. Show up every day and the run grows.
                Miss one and it resets. The board keeps the receipts.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/login" className="btn btn-primary !min-h-12 !px-6">
                  Enter the challenge
                  <span aria-hidden="true">→</span>
                </Link>
                <Link href="/leaderboard" className="btn btn-ghost !min-h-12 !px-6">
                  See the board
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                <span>{pluralize(participants, "person", "people")} in</span>
                <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
                <span>{pluralize(totalMarks, "mark")} on the board</span>
                <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
                <span>Best run: {topBest}</span>
              </div>
            </div>

            <div className="animate-rise [animation-delay:140ms]">
              <PerfectMonth />
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="shell grid grid-cols-2 gap-8 py-9 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-line">
            <div className="sm:px-6 sm:first:pl-0">
              <Stat label="In the running" value={participants} accent />
            </div>
            <div className="sm:px-6">
              <Stat label="Marks made" value={totalMarks} />
            </div>
            <div className="sm:px-6">
              <Stat label="Longest run" value={topBest} suffix="days" />
            </div>
            <div className="sm:px-6 sm:last:pr-0">
              <Stat label="Window" value="30" suffix="days" />
            </div>
          </div>
        </section>

        <section id="rules" className="scroll-mt-24 border-b border-line py-16 sm:py-24">
          <div className="shell">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div>
                <div className="eyebrow">The deal</div>
                <h2 className="display mt-4 text-5xl text-bone sm:text-6xl">
                  No loopholes.
                  <br />
                  No do-overs.
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-7 text-bone-dim">
                  The rules are intentionally small. What makes it hard is that they don&apos;t
                  move.
                </p>
                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
                  Undo is today-only
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {RULES.map((rule) => (
                  <div key={rule.number} className="border-t border-line py-6">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-ember">{rule.number}</span>
                      <h3 className="text-[15px] font-bold text-bone">{rule.title}</h3>
                    </div>
                    <p className="mt-2.5 pl-7 text-[13px] leading-6 text-bone-dim">{rule.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line py-16 sm:py-24">
          <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
            <div>
              <div className="eyebrow">The board</div>
              <h2 className="display mt-4 text-5xl text-bone sm:text-6xl">Proof, ranked.</h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-bone-dim">
                Ranked by best streak. Ties break on current streak, then days marked, then
                handle. No participation trophies.
              </p>
              <Link href="/leaderboard" className="btn btn-ghost mt-7">
                Full leaderboard <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div>
              <LeaderboardTable rows={rows.slice(0, 5)} compact />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="shell">
            <div className="card relative overflow-hidden px-6 py-12 sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-ember/20 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="eyebrow">November is a decision</div>
                  <h2 className="display mt-4 max-w-2xl text-5xl text-bone sm:text-7xl">
                    Start where you are.
                    <br />
                    <span className="text-ember">The run starts today.</span>
                  </h2>
                </div>
                <div className="shrink-0">
                  <Link href="/login" className="btn btn-primary !min-h-12 !px-7">
                    Claim your handle <span aria-hidden="true">→</span>
                  </Link>
                  <p className="mt-3 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                    Google sign-in · one minute setup
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
