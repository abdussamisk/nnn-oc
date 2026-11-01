const RPC_MESSAGES: Record<string, string> = {
  not_authenticated: "Your session expired. Sign in again.",
  profile_missing: "Finish onboarding first.",
  challenge_closed: "The challenge is closed. The board is read-only.",
  before_join: "That day is before you joined.",
  invalid_handle: "Handles need 3–20 letters, numbers, or underscores.",
  handle_blocked: "That handle isn't available.",
  handle_taken: "That handle is already taken.",
  already_onboarded: "You're already onboarded.",
  invalid_timezone: "That timezone isn't recognized.",
};

export function rpcErrorMessage(error: { message?: string } | null): string {
  if (!error?.message) return "Something went wrong. Try again.";
  const code = error.message.split("\n")[0].trim();
  return RPC_MESSAGES[code] ?? "Something went wrong. Try again.";
}

export function isProfileMissing(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("profile_missing"));
}
