import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DayTile } from "@/components/day-tile";
import { PhaseBadge } from "@/components/phase-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stat } from "@/components/stat";
import { getPublicProfile } from "@/lib/board";
import { DAYS, getDayState } from "@/lib/challenge";
import { formatDateString, ordinal, pluralize } from "@/lib/format";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(decodeURIComponent(handle));

  if (!profile) {
    return { title: "Profile not found" };
  }

  const description = `@${profile.handle} marked ${pluralize(profile.days_marked, "day")} with a best streak of ${pluralize(profile.best_streak, "day")}. A public record of November 2026.`;

  return {
    title: `@${profile.handle} — ${profile.best_streak} day best`,
    description,
    alternates: { canonical: `${siteUrl()}/share/${profile.handle}` },
    openGraph: {
      title: `@${profile.handle} — ${profile.best_streak} day best`,
      description,
      type: "profile",
      images: [
        {
          url: `/share/${profile.handle}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `@${profile.handle}'s NNN card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `@${profile.handle} — ${profile.best_streak} day best`,
      description,
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getPublicProfile(decodeURIComponent(handle));

  if (!profile) notFound();

  return (
    <>
      <SiteHeader />

      <main className="shell py-10 sm:py-16">
        <div className="flex flex-wrap items-center gap-3">
          <PhaseBadge phase={profile.phase} />
          <span className="eyebrow">
            Public record · Joined {formatDateString(profile.joined_on, "long")}
          </span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="eyebrow">The November run of</div>
            <h1 className="display mt-3 break-all text-[clamp(3.8rem,10vw,8rem)] text-bone">
              @{profile.handle}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-bone-dim sm:text-base">
              {profile.days_marked === 0
                ? "The handle is claimed. The first mark is still waiting."
                : `${pluralize(profile.days_marked, "day")} marked. A best run of ${pluralize(profile.best_streak, "day")}. ${profile.phase === "closed" ? "The season is frozen." : "The month is still live."}`}
            </p>
          </div>

          <div className="flex items-end justify-between gap-6 border-t border-line pt-6 lg:border-0 lg:pt-0">
            <div>
              <div className="eyebrow">Board rank</div>
              <div className="display mt-2 text-6xl text-ember">
                {profile.rank ? `#${profile.rank}` : "—"}
              </div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                {profile.rank ? ordinal(profile.rank) : "Unranked"}
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow">Best streak</div>
              <div className="display mt-2 text-6xl text-bone">{profile.best_streak}</div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                days
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-7 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-line">
          <div className="sm:pr-6">
            <Stat label="Best streak" value={profile.best_streak} suffix="days" accent />
          </div>
          <div className="sm:px-6">
            <Stat label="Current" value={profile.current_streak} suffix="days" />
          </div>
          <div className="sm:px-6">
            <Stat label="Days marked" value={profile.days_marked} suffix="/ 30" />
          </div>
          <div className="sm:pl-6">
            <Stat label="Rank" value={profile.rank ? `#${profile.rank}` : "—"} />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="eyebrow">The month</div>
                <h2 className="display mt-2 text-3xl text-bone">Every box tells the story.</h2>
              </div>
              <span className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                {profile.days_marked} marked
              </span>
            </div>

            <div className="mt-6 grid grid-cols-6 gap-1.5 sm:grid-cols-10">
              {DAYS.map((day) => (
                <DayTile
                  key={day}
                  day={day}
                  state={getDayState(day, {
                    markedDays: profile.marked_days,
                    joinedOn: profile.joined_on,
                    todayDay: profile.today_day,
                    phase: profile.phase,
                  })}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 font-mono text-[9px] tracking-[0.1em] text-muted uppercase">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-ember" /> marked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-ink-3" /> missed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] border border-dashed border-line-strong" />{" "}
                excused
              </span>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="eyebrow">The receipt</div>
            <h2 className="display mt-2 text-3xl text-bone">Post the proof.</h2>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              This page only knows the handle. No email, real name, or Google avatar is ever
              exposed.
            </p>

            <a
              href={`/share/${profile.handle}/card`}
              className="btn btn-primary mt-5 w-full !min-h-11"
            >
              Download PNG <span aria-hidden="true">↓</span>
            </a>
            <Link href="/leaderboard" className="btn btn-ghost mt-2 w-full !min-h-11">
              See the full board
            </Link>

            <div className="mt-5 border-t border-line pt-4">
              <div className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                Want your own?
              </div>
              <p className="mt-2 text-[12px] leading-5 text-bone-dim">
                Claim a handle, mark today, and this page becomes yours.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex text-[11px] font-semibold text-ember link-underline"
              >
                Enter the challenge →
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
            Nov 1–30, 2026 · Public record
          </p>
          <Link href="/" className="text-[12px] font-semibold text-bone-dim hover:text-bone">
            What is NNN? →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
