"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { rpcErrorMessage } from "@/lib/rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkHandle, isValidTimezone } from "@/lib/validation";

export type OnboardState = {
  error?: string;
  values?: {
    handle?: string;
    timezone?: string;
  };
};

export async function onboardAction(
  _previous: OnboardState,
  formData: FormData,
): Promise<OnboardState> {
  const rawHandle = String(formData.get("handle") ?? "");
  const timezone = String(formData.get("timezone") ?? "").trim();

  const handleCheck = checkHandle(rawHandle);
  if (!handleCheck.ok) {
    return {
      error:
        handleCheck.code === "handle_format"
          ? "Handles need 3–20 letters, numbers, or underscores."
          : "That handle isn't available. Pick another.",
      values: { handle: rawHandle, timezone },
    };
  }

  if (!isValidTimezone(timezone)) {
    return {
      error: "That timezone isn't recognized. Pick one from the list.",
      values: { handle: rawHandle, timezone },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("onboard", {
    p_handle: handleCheck.value,
    p_timezone: timezone,
  });

  if (error) {
    if (error.message.includes("already_onboarded")) {
      redirect("/dashboard");
    }
    return {
      error: rpcErrorMessage(error),
      values: { handle: rawHandle, timezone },
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
