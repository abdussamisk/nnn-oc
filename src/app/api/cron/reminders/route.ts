import { NextResponse } from "next/server";

import { sendReminderStub } from "@/lib/reminders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DueReminder = {
  user_id: string;
  email: string | null;
  handle: string;
  local_date: string;
  challenge_day: number;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("due_reminders");

  if (error) {
    console.error("[cron] due_reminders failed", error.message);
    return NextResponse.json({ error: "Reminder query failed." }, { status: 500 });
  }

  const due = (data ?? []) as DueReminder[];
  let logged = 0;

  for (const reminder of due) {
    const { error: insertError } = await admin.from("reminder_log").insert({
      user_id: reminder.user_id,
      local_date: reminder.local_date,
      channel: "email_stub",
    });

    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("[cron] reminder_log insert failed", insertError.message);
      }
      continue;
    }

    logged += 1;
    sendReminderStub({
      email: reminder.email ?? "(no email)",
      handle: reminder.handle,
      localDate: reminder.local_date,
      challengeDay: reminder.challenge_day,
    });
  }

  return NextResponse.json({ due: due.length, logged });
}
