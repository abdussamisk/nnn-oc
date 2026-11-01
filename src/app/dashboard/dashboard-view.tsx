"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ClipPopup, type ClipPopupHandle } from "@/components/clip-popup";
import { DayGrid } from "@/components/day-grid";
import { Logo } from "@/components/logo";
import { PhaseBadge } from "@/components/phase-badge";
import { Stat } from "@/components/stat";
import { formatCountdown, formatDateString } from "@/lib/format";
import type { Clip, DashboardState } from "@/lib/types";

import { CopyLink } from "./copy-link";
import { TimezoneForm } from "./timezone-form";

type Busy = "mark" | "unmark" | null;
type Toast = { tone: "error" | "success"; message: string } | null;

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function DashboardView({
  initialState,
  initialClip,
  clipFetchedAt: initialClipFetchedAt,
}: {
  initialState: DashboardState;
  initialClip: Clip | null;
  clipFetchedAt: string;
}) {
  const popupRef = useRef<ClipPopupHandle>(null);
  const busyRef = useRef(false);
  const [state, setState] = useState(initialState);
  const [clip, setClip] = useState(initialClip);
  const [clipFetchedAt, setClipFetchedAt] = useState(initialClipFetchedAt);
  const [busy, setBusy] = useState<Busy>(null);
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    setClip(initialClip);
    setClipFetchedAt(initialClipFetchedAt);
  }, [initialClip, initialClipFetchedAt]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function refreshTodayClip(): Promise<Clip | null> {
    try {
      const response = await fetch("/api/clip/today", { cache: "no-store" });
      if (!response.ok) return null;
      const body = await readJson<{ clip: Clip | null }>(response);
      if (!body) return null;
      setClip(body.clip);
      setClipFetchedAt(new Date().toISOString());
      return body.clip;
    } catch {
      return null;
    }
  }

  async function handleMark() {
    if (busyRef.current || state.phase !== "open" || state.today_day === null) return;
    if (state.today_marked) {
      await handleUnmark();
      return;
    }

    busyRef.current = true;
    const day = state.today_day;
    const previous = state;
    setBusy("mark");
    setState({
      ...state,
      today_marked: true,
      marked_days: [...state.marked_days, day].sort((a, b) => a - b),
      days_marked: state.days_marked + 1,
    });

    let activeClip = clip;
    const age = Date.now() - new Date(clipFetchedAt).getTime();
    if (activeClip && age > 3.5 * 60 * 60 * 1000) {
      // Keep the old URL if refresh fails; it is usually still valid for a while.
      const fresh = await refreshTodayClip();
      if (fresh) activeClip = fresh;
    }

    // Optimistic popup: starts inside the click gesture when the clip is warm.
    if (activeClip) {
      popupRef.current?.open(activeClip, day, "mark");
    }

    try {
      const response = await fetch("/api/mark", { method: "POST" });
      const body = await readJson<{ state?: DashboardState; error?: string }>(response);
      if (!response.ok || !body?.state) {
        throw new Error(body?.error || "Could not mark today.");
      }

      setState(body.state);
      if (!activeClip) {
        popupRef.current?.open(null, day, "mark");
      }
    } catch (error) {
      popupRef.current?.close();
      setState(previous);
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not mark today.",
      });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleUnmark() {
    if (busyRef.current || state.today_day === null) return;
    busyRef.current = true;
    const previous = state;
    setBusy("unmark");
    popupRef.current?.close();
    setState({
      ...state,
      today_marked: false,
      marked_days: state.marked_days.filter((day) => day !== state.today_day),
      days_marked: Math.max(0, state.days_marked - 1),
    });

    try {
      const response = await fetch("/api/mark", { method: "DELETE" });
      const body = await readJson<{ state?: DashboardState; error?: string }>(response);
      if (!response.ok || !body?.state) {
        throw new Error(body?.error || "Could not undo today.");
      }
      setState(body.state);
    } catch (error) {
      setState(previous);
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not undo today.",
      });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleSelectDay(day: number) {
    if (busyRef.current || loadingDay) return;
    setLoadingDay(day);
    try {
      const response = await fetch(`/api/clip/${day}`, { cache: "no-store" });
      if (response.status === 404) {
        popupRef.current?.open(null, day, "archive");
      } else {
        const body = await readJson<{ clip?: Clip; error?: string }>(response);
        if (!response.ok || !body?.clip) {
          throw new Error(body?.error || "Could not load that clip.");
        }
        popupRef.current?.open(body.clip, day, "archive");
      }
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not load that clip.",
      });
    } finally {
      setLoadingDay(null);
    }
  }

  const phaseCopy =
    state.phase === "open"
      ? `Day ${state.today_day ?? "—"} of 30`
      : state.phase === "pre"
        ? "Opens November 1"
        : "Season closed";

  return (
    <>
      <header className="border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-4 w-px bg-line sm:block" />
            <span className="hidden font-mono text-[10px] tracking-[0.14em] text-muted uppercase sm:inline">
              @{state.handle}
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/leaderboard"
              className="hidden px-2 py-2 text-[12px] font-semibold text-bone-dim transition-colors hover:text-bone sm:block"
            >
              The board
            </Link>
            <Link
              href={`/share/${state.handle}`}
              className="hidden px-2 py-2 text-[12px] font-semibold text-bone-dim transition-colors hover:text-bone sm:block"
            >
              Share
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-bone-dim transition-colors hover:border-line-strong hover:text-bone"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="shell py-9 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PhaseBadge phase={state.phase} />
              <span className="eyebrow">
                {state.today ? formatDateString(state.today, "long") : "November 2026"}
              </span>
            </div>
            <h1 className="display mt-4 text-5xl text-bone sm:text-6xl">Your November.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-bone-dim">
              @{state.handle} · {state.timezone}. One mark a day. The server keeps the clock.
            </p>
          </div>

          <div className="sm:text-right">
            <div className="eyebrow">Next local midnight</div>
            {state.phase === "open" ? (
              <Countdown nextMidnight={state.next_midnight} serverNow={state.server_now} />
            ) : (
              <div className="mt-2 font-mono text-[13px] text-muted">
                {state.phase === "closed" ? "Board frozen" : "Not started"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-7 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-line">
          <div className="sm:pr-6">
            <Stat label="Current streak" value={state.current_streak} suffix="days" accent />
          </div>
          <div className="sm:px-6">
            <Stat label="Best streak" value={state.best_streak} suffix="days" />
          </div>
          <div className="sm:px-6">
            <Stat label="Days marked" value={state.days_marked} suffix="/ 30" />
          </div>
          <div className="sm:pl-6">
            <Stat label="Board rank" value={state.rank ? `#${state.rank}` : "—"} />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.32fr_0.68fr]">
          <div className="space-y-5">
            <section className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="eyebrow">The month</div>
                  <h2 className="display mt-2 text-3xl text-bone">Thirty boxes.</h2>
                </div>
                <div className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                  {state.days_marked} marked · {30 - state.days_marked} open
                </div>
              </div>

              <div className="mt-6">
                <DayGrid
                  markedDays={state.marked_days}
                  joinedOn={state.joined_on}
                  todayDay={state.today_day}
                  phase={state.phase}
                  onSelectDay={handleSelectDay}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 font-mono text-[9px] tracking-[0.1em] text-muted uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px] bg-ember" /> marked
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px] border border-ember/70" /> today
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px] bg-ink-3" /> missed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px] border border-dashed border-line-strong" />{" "}
                  excused
                </span>
                {loadingDay ? <span className="text-ember">loading day {loadingDay}…</span> : null}
              </div>

              <p className="mt-3 text-[11px] leading-5 text-muted">
                Tap a marked day to replay its clip. Days before you joined are excused, not
                missed.
              </p>
            </section>

            <section className="card p-5 sm:p-6">
              <TimezoneForm
                timezone={state.timezone}
                pending={state.pending_timezone}
                pendingAt={state.pending_timezone_at}
              />
            </section>
          </div>

          <div className="space-y-5">
            <section className="card relative overflow-hidden p-5 sm:p-6">
              <div
                className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-ember/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="eyebrow">Today</div>
                  <span className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                    {phaseCopy}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="display text-7xl text-bone">
                    {state.today_day ? String(state.today_day).padStart(2, "0") : "—"}
                  </div>
                  <div className="pb-2 text-right">
                    <div className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                      Local date
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-bone-dim">
                      {state.today ? formatDateString(state.today) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  {state.phase === "open" ? (
                    state.today_marked ? (
                      <div>
                        <div className="flex items-center gap-2 text-[13px] font-bold text-live">
                          <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
                          Marked today
                        </div>
                        <p className="mt-1.5 text-[11px] leading-5 text-muted">
                          Undo is available until your local midnight. After that, the day is
                          sealed.
                        </p>
                        <button
                          type="button"
                          onClick={handleUnmark}
                          disabled={busy !== null}
                          className="btn btn-ghost mt-4 w-full"
                        >
                          {busy === "unmark" ? "Undoing…" : "Undo today"}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[13px] font-bold text-bone">
                          The day is still open.
                        </div>
                        <p className="mt-1.5 text-[11px] leading-5 text-muted">
                          One click. No backfill. Your run grows if yesterday was marked.
                        </p>
                        <button
                          type="button"
                          onClick={handleMark}
                          disabled={busy !== null}
                          className="btn btn-primary mt-4 w-full !min-h-12"
                        >
                          {busy === "mark" ? "Marking…" : `Mark day ${state.today_day}`}
                          {busy === "mark" ? null : <span aria-hidden="true">→</span>}
                        </button>
                      </div>
                    )
                  ) : state.phase === "pre" ? (
                    <div>
                      <div className="text-[13px] font-bold text-bone">Not open yet.</div>
                      <p className="mt-1.5 text-[11px] leading-5 text-muted">
                        The first mark unlocks at midnight on November 1 in your timezone.
                      </p>
                      <button type="button" disabled className="btn btn-ghost mt-4 w-full">
                        Opens Nov 1
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[13px] font-bold text-bone">The season is closed.</div>
                      <p className="mt-1.5 text-[11px] leading-5 text-muted">
                        The board is frozen and read-only. Signups are still open for next time.
                      </p>
                      <button type="button" disabled className="btn btn-ghost mt-4 w-full">
                        Marking closed
                      </button>
                    </div>
                  )}
                </div>

                {state.phase === "open" ? (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-3.5 py-2.5">
                    <span className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
                      Resets in
                    </span>
                    <span className="font-mono text-[12px] text-bone">
                      <Countdown
                        nextMidnight={state.next_midnight}
                        serverNow={state.server_now}
                        compact
                      />
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-muted">
                  <span className="mt-0.5 text-ember" aria-hidden="true">
                    ◇
                  </span>
                  {clip
                    ? "Your clip is ready. It plays after you mark."
                    : "No clip uploaded for today yet. Your mark still counts."}
                </div>
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="eyebrow">Your receipt</div>
              <h2 className="display mt-2 text-3xl text-bone">Make it postable.</h2>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                A public page with your run, your best, and your handle. No email, no real name.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/share/${state.handle}`} className="btn btn-ghost !min-h-10 !px-4 !text-[11px]">
                  View page
                </Link>
                <CopyLink path={`/share/${state.handle}`} />
              </div>
              <a
                href={`/share/${state.handle}/card`}
                className="mt-3 inline-flex text-[11px] font-semibold text-bone-dim link-underline"
              >
                Download share card (PNG)
              </a>
            </section>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
            Nov 1–30, 2026 · No backfill · Undo today only
          </p>
          <Link href="/leaderboard" className="text-[12px] font-semibold text-bone-dim hover:text-bone">
            See where you stand →
          </Link>
        </div>
      </main>

      <ClipPopup
        ref={popupRef}
        preloadClip={clip}
        todayDay={state.today_day}
        onRefreshToday={refreshTodayClip}
      />

      {toast ? (
        <div
          className={`fixed bottom-5 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-[12px] shadow-2xl ${
            toast.tone === "error"
              ? "border-ember/40 bg-[#2a0d07] text-ember-soft"
              : "border-live/30 bg-[#131a05] text-live"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );
}

function Countdown({
  nextMidnight,
  serverNow,
  compact = false,
}: {
  nextMidnight: string;
  serverNow: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(
    () => new Date(nextMidnight).getTime() - new Date(serverNow).getTime(),
  );
  const refreshed = useRef(false);

  useEffect(() => {
    refreshed.current = false;
    const offset = Date.now() - new Date(serverNow).getTime();

    const tick = () => {
      const next = new Date(nextMidnight).getTime() - (Date.now() - offset);
      setRemaining(next);
      if (next <= 0 && !refreshed.current) {
        refreshed.current = true;
        router.refresh();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [nextMidnight, serverNow, router]);

  return (
    <span
      className={
        compact
          ? "font-mono text-[12px] text-bone"
          : "mt-2 block font-mono text-[13px] text-bone"
      }
      suppressHydrationWarning
    >
      {formatCountdown(remaining)}
    </span>
  );
}
