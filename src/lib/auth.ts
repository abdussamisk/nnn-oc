import "server-only";

import { cache } from "react";

import { supabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getAuthUser = cache(async () => {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
});

export const getOwnProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, handle, timezone, joined_on")
      .eq("id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});
