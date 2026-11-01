"use client";

import { useActionState, useEffect, useState } from "react";

import { onboardAction, type OnboardState } from "./actions";

const INITIAL: OnboardState = {};

export function OnboardingForm({ defaultTimezone }: { defaultTimezone: string }) {
  const [state, formAction, pending] = useActionState(onboardAction, INITIAL);
  const [timezone, setTimezone] = useState("");
  const [detected, setDetected] = useState(defaultTimezone);
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setDetected(browserZone);
    setTimezone((current) => current || browserZone);

    try {
      const supported = Intl.supportedValuesOf("timeZone");
      setZones(supported);
    } catch {
      setZones([]);
    }
  }, []);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="handle" className="label">
          Your handle
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm text-muted">
            @
          </span>
          <input
            id="handle"
            name="handle"
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]{3,20}"
            autoComplete="username"
            spellCheck={false}
            defaultValue={state.values?.handle ?? ""}
            placeholder="night_shift"
            className="input !pl-9 font-mono"
          />
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted">
          3–20 characters. Letters, numbers, underscores. This is the only name the board will
          ever show.
        </p>
      </div>

      <div>
        <label htmlFor="timezone" className="label">
          Your timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          required
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          list="timezone-list"
          autoComplete="off"
          spellCheck={false}
          placeholder="America/New_York"
          className="input font-mono"
        />
        <datalist id="timezone-list">
          {zones.map((zone) => (
            <option value={zone} key={zone} />
          ))}
        </datalist>
        <p className="mt-2 text-[11px] leading-5 text-muted">
          Detected: <span className="text-bone-dim">{detected}</span>. Midnight here decides when
          your day flips. Changes take effect at the new zone&apos;s next midnight.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-[13px] text-ember-soft">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full !min-h-12">
        {pending ? "Claiming…" : "Claim my handle"}
        {!pending ? <span aria-hidden="true">→</span> : null}
      </button>

      <p className="text-center font-mono text-[9px] leading-5 tracking-[0.1em] text-muted uppercase">
        Your email and Google profile stay private
      </p>
    </form>
  );
}
