"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDateTimeInZone } from "@/lib/format";

import { updateTimezoneAction, type TimezoneState } from "./actions";

const INITIAL: TimezoneState = {};

export function TimezoneForm({
  timezone,
  pending,
  pendingAt,
}: {
  timezone: string;
  pending: string | null;
  pendingAt: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateTimezoneAction, INITIAL);
  const [zone, setZone] = useState(timezone);
  const [zones, setZones] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      setZones(Intl.supportedValuesOf("timeZone"));
    } catch {
      setZones([]);
    }
  }, []);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, state.pending, state.pendingAt, router]);

  const effectivePending = (state.ok ? state.pending : pending) ?? null;
  const effectivePendingAt = (state.ok ? state.pendingAt : pendingAt) ?? null;
  const pendingLabel = effectivePending
    ? formatDateTimeInZone(effectivePendingAt, effectivePending)
    : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Timezone</div>
          <div className="mt-2 font-mono text-[13px] text-bone">{state.timezone ?? timezone}</div>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
          Server-side
        </span>
      </div>

      {effectivePending && pendingLabel ? (
        <div className="mt-4 rounded-xl border border-ember/25 bg-ember/[0.07] px-4 py-3">
          <div className="font-mono text-[9px] tracking-[0.14em] text-ember uppercase">
            Change queued
          </div>
          <p className="mt-1.5 text-[12px] leading-5 text-bone-dim">
            Switching to <span className="text-bone">{effectivePending}</span> at {pendingLabel}.
            Until then, your current zone still decides the day.
          </p>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="timezone" className="sr-only">
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            required
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            list="dashboard-timezones"
            autoComplete="off"
            spellCheck={false}
            className="input !min-h-10 !py-2 font-mono !text-[12px]"
          />
          <datalist id="dashboard-timezones">
            {zones.map((item) => (
              <option value={item} key={item} />
            ))}
          </datalist>
        </div>
        <button type="submit" disabled={isPending} className="btn btn-ghost !min-h-10 !px-4 !text-[11px]">
          {isPending ? "Saving…" : "Save zone"}
        </button>
      </form>

      {state.error ? (
        <p className="mt-2 text-[11px] leading-5 text-ember-soft">{state.error}</p>
      ) : state.ok && !state.pending ? (
        <p className="mt-2 text-[11px] leading-5 text-live">Timezone saved.</p>
      ) : null}

      <p className="mt-3 text-[11px] leading-5 text-muted">
        A change waits for the new zone&apos;s next midnight. That stops zone-hopping from
        unlocking tomorrow early.
      </p>
    </div>
  );
}
