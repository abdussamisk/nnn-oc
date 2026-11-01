import "server-only";

/**
 * Reminder sender stub. Replace this with a provider call (Resend, Postmark,
 * SES, ...) when email is ready to leave the system.
 */
export function sendReminderStub(input: {
  email: string;
  handle: string;
  localDate: string;
  challengeDay: number;
}): void {
  console.log(
    `[reminder:stub] would email ${input.email} (@${input.handle}) for day ${input.challengeDay} on ${input.localDate}`,
  );
}
