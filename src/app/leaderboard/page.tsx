import type { Metadata } from "next";
import Link from "next/link";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { PhaseBadge } from "@/components/phase-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLeaderboard } from "@/lib/board";
import { phaseForUtcDate } from "@/lib/challenge";
import { ordinal, pluralize } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "The board",
  description:
    "The public NNN leaderboard for November 2026. Ranked by best streak, then current streak, days marked, and handle.",
};

export const dynamic = "force-dynamic";

function PodiumCard({ row, featured }: { row: LeaderboardRow; featured: boolean }) {
  return (
    <div
      className={`card relative overflow-hidden p-6 ${
        featured ? "border-ember/45 bg-ember/[0.035] md:-translate-y-2" : ""
      }`}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-ember/20 blur-3xl"
          aria-hidden="true"
        />
      ) : null}
      <div className="relative flex items-center justify-between">
        <span className={`font-mono text-[11px] ${featured ? "text-ember" : "text-muted"}`}>
          {String(row.rank).padStart(2, "0")}
        </span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
          {ordinal(row.rank)}
        </span>
      </div>

      <Link
        href={`/share/${row.handle}`}
        className="relative mt-7 block truncate text-2xl font-bold text-bone transition-colors hover:text-ember-soft"
      >
        <span className="text-muted">@</span>
        {row.handle}
      </Link>

      <div className="relative mt-5 flex items-end gap-2">
        <span className={`display text-7xl ${featured ? "text-ember" : "text-bone"}`}>
          {row.best_streak}
        </span>
        <span className="pb-2 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
          day best
        </span>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <div className="font-mono text-[8px] tracking-[0.14em] text-muted uppercase">Current</div>
          <div className="mt-1 font-mono text-[13px] text-bone-dim">{row.current_streak}</div>
        </div>
        <div>
          <div className="font-mono text-[8px] tracking-[0.14em] text-muted uppercase">Marked</div>
          <div className="mt-1 font-mono text-[13px] text-bone-dim">{row.days_marked} / 30</div>
        </div>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();
  const phase = phaseForUtcDate();
  const totalMarks = rows.reduce((sum, row) => sum + row.days_marked, 0);
  const topBest = rows[0]?.best_streak ?? 0;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="border-b border-line">
          <div className="shell py-14 sm:py-20">
            <div className="flex flex-wrap items-center gap-3">
              <PhaseBadge phase={phase} />
              <span className="eyebrow">Public · ranked by best streak</span>
            </div>

            <div className="mt-6 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="display text-[clamp(4.5rem,10vw,8.5rem)] text-bone">The board.</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-bone-dim sm:text-base">
                  Proof, ranked. Best streak first. Ties go to current streak, then days marked,
                  then handle. Only people with at least one mark appear.
                </p>
              </div>

              <div className="flex gap-8 border-t border-line pt-5 lg:border-0 lg:pt-0">
                <div>
                  <div className="eyebrow">In the running</div>
                  <div className="display mt-1 text-4xl text-bone">{rows.length}</div>
                </div>
                <div>
                  <div className="eyebrow">Marks made</div>
                  <div className="display mt-1 text-4xl text-bone">{totalMarks}</div>
                </div>
                <div>
                  <div className="eyebrow">Longest run</div>
                  <div className="display mt-1 text-4xl text-ember">{topBest}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="shell">
            {rows.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  {rows.slice(0, 3).map((row, index) => (
                    <PodiumCard key={row.handle} row={row} featured={index === 0} />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <div className="eyebrow">Every name, every mark</div>
                  <div className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                    {pluralize(rows.length, "handle")} · {pluralize(totalMarks, "mark")}
                  </div>
                </div>

                <div className="mt-4">
                  <LeaderboardTable rows={rows} />
                </div>
              </>
            ) : (
              <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="eyebrow">No marks yet</div>
                <h2 className="display mt-4 text-5xl text-bone">Be the first name.</h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-bone-dim">
                  The board fills one mark at a time. Claim a handle, mark today, and you&apos;re
                  on it.
                </p>
                <Link href="/login" className="btn btn-primary mt-7">
                  Enter the challenge <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <p className="max-w-xl text-[11px] leading-5 text-muted">
                December is frozen and read-only. Signups stay open, but marking closes after
                November 30. Handles only — emails and real names never appear here.
              </p>
              <Link href="/#rules" className="text-[12px] font-semibold text-bone-dim hover:text-bone">
                Read the rules →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
