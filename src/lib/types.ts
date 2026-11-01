export type Phase = "pre" | "open" | "closed";

export type DashboardState = {
  handle: string;
  timezone: string;
  pending_timezone: string | null;
  pending_timezone_at: string | null;
  joined_on: string;
  today: string;
  today_day: number | null;
  phase: Phase;
  marked_days: number[];
  today_marked: boolean;
  current_streak: number;
  best_streak: number;
  days_marked: number;
  rank: number | null;
  next_midnight: string;
  server_now: string;
};

export type LeaderboardRow = {
  rank: number;
  handle: string;
  best_streak: number;
  current_streak: number;
  days_marked: number;
};

export type PublicProfile = {
  handle: string;
  joined_on: string;
  phase: Phase;
  today: string;
  today_day: number | null;
  best_streak: number;
  current_streak: number;
  days_marked: number;
  rank: number | null;
  marked_days: number[];
};

export type ClipKind = "video" | "image";

export type Clip = {
  day: number;
  url: string;
  kind: ClipKind;
  filename: string;
};

export type DayState = "marked" | "today" | "missed" | "future" | "excused";
