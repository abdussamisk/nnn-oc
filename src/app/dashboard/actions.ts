"use server";

import { revalidatePath } from "next/cache";

import { rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/validation";

export type TimezoneState = {
  ok?: boolean;
  error?: string;
  timezone?: string;
  pending?: string | null;
  pendingAt?: string | null;
};

export async function updateTimezoneAction(
  _previous: TimezoneState,
  formData: FormData,
): Promise<TimezoneState> {
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!isValidTimezone(timezone)) {
    return { error: "That timezone isn't recognized. Pick one from the list." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("set_timezone", { p_timezone: timezone });

  if (error) {
    return { error: rpcErrorMessage(error) };
  }

  revalidatePath("/dashboard");

  const result = data as {
    timezone: string;
    pending_timezone: string | null;
    pending_timezone_at: string | null;
  };

  return {
    ok: true,
    timezone: result.timezone,
    pending: result.pending_timezone,
    pendingAt: result.pending_timezone_at,
  };
}
