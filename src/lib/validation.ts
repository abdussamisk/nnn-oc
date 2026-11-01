export const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

// Keep in sync with private.is_blocked_handle() in the SQL migration.
const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "moderator",
  "support",
  "official",
  "staff",
  "system",
  "root",
  "nnn",
  "november",
  "sex",
]);

const BLOCKED_FRAGMENTS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "asshole",
  "dick",
  "cock",
  "pussy",
  "porn",
  "nude",
  "rape",
  "nazi",
  "hitler",
  "slut",
  "whore",
  "onlyfans",
  "pedo",
  "paedo",
];

export type HandleCheck =
  | { ok: true; value: string }
  | { ok: false; code: "handle_format" | "handle_blocked" };

export function checkHandle(raw: string): HandleCheck {
  const value = raw.trim();
  if (!HANDLE_PATTERN.test(value)) {
    return { ok: false, code: "handle_format" };
  }
  const lower = value.toLowerCase();
  if (
    RESERVED_HANDLES.has(lower) ||
    BLOCKED_FRAGMENTS.some((fragment) => lower.includes(fragment))
  ) {
    return { ok: false, code: "handle_blocked" };
  }
  return { ok: true, value };
}

export function isValidTimezone(timezone: string): boolean {
  if (!timezone || timezone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
