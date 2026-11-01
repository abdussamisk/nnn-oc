"use client";

import { DayTile } from "@/components/day-tile";
import { DAYS, getDayState } from "@/lib/challenge";
import type { Phase } from "@/lib/types";

export function DayGrid({
  markedDays,
  joinedOn,
  todayDay,
  phase,
  onSelectDay,
  compact = false,
}: {
  markedDays: number[];
  joinedOn: string;
  todayDay: number | null;
  phase: Phase;
  onSelectDay?: (day: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid gap-1.5 ${compact ? "grid-cols-10" : "grid-cols-6 sm:grid-cols-10"}`}
      role="list"
      aria-label="Challenge days"
    >
      {DAYS.map((day) => {
        const state = getDayState(day, { markedDays, joinedOn, todayDay, phase });
        const canOpen = state === "marked" && Boolean(onSelectDay);
        return (
          <div role="listitem" key={day}>
            <DayTile
              day={day}
              state={state}
              size={compact ? "small" : "default"}
              onClick={canOpen ? () => onSelectDay?.(day) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
