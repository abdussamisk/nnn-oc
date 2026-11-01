import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get("nnn_next")?.value);

  // Setup the production domain origin context safely
  const baseOrigin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const cleanOrigin = baseOrigin.endsWith('/') ? baseOrigin.slice(0, -1) : baseOrigin;

  if (!code) {
    return NextResponse.redirect(`${cleanOrigin}/login?error=callback`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${cleanOrigin}/login?error=callback`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  const destination = profile ? next : "/onboarding";
  const response = NextResponse.redirect(`${cleanOrigin}${destination}`);
  response.cookies.delete("nnn_next");
  return response;
}
