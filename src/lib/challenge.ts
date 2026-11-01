import type { DayState, Phase } from "@/lib/types";

export const CHALLENGE_YEAR = 2026;
export const CHALLENGE_MONTH = 11;
export const CHALLENGE_DAYS = 30;
export const CHALLENGE_START = "2026-11-01";
export const CHALLENGE_END = "2026-11-30";

export const DAYS = Array.from({ length: CHALLENGE_DAYS }, (_, index) => index + 1);

export function dayNumberFromJoinedOn(joinedOn: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(joinedOn);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < CHALLENGE_YEAR || (year === CHALLENGE_YEAR && month < CHALLENGE_MONTH)) {
    return 0;
  }
  if (year > CHALLENGE_YEAR || (year === CHALLENGE_YEAR && month > CHALLENGE_MONTH)) {
    return CHALLENGE_DAYS + 1;
  }
  return Math.min(Math.max(day, 1), CHALLENGE_DAYS + 1);
}

export function getDayState(
  day: number,
  input: {
    markedDays: number[];
    joinedOn: string;
    todayDay: number | null;
    phase: Phase;
  },
): DayState {
  const joinedDay = dayNumberFromJoinedOn(input.joinedOn);

  if (day < joinedDay) return "excused";
  if (input.markedDays.includes(day)) return "marked";

  if (input.phase === "closed") return "missed";
  if (input.phase === "pre") return "future";
  if (input.todayDay === null) return "future";
  if (day === input.todayDay) return "today";
  if (day < input.todayDay) return "missed";
  return "future";
}

/** UTC phase for public pages. Per-user phase is decided server-side in SQL. */
export function phaseForUtcDate(date = new Date()): Phase {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if (year < CHALLENGE_YEAR || (year === CHALLENGE_YEAR && month < CHALLENGE_MONTH)) {
    return "pre";
  }
  if (year > CHALLENGE_YEAR || (year === CHALLENGE_YEAR && month > CHALLENGE_MONTH)) {
    return "closed";
  }
  return day <= CHALLENGE_DAYS ? "open" : "closed";
}
