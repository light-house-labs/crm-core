import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server"; // Oops, fixing this import path

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || "")}`);
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
       // if the whitelist trigger denied access, sessionError will contain that msg
       return NextResponse.redirect(`${origin}/login?error=Access%20Denied&error_description=${encodeURIComponent(sessionError.message)}`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid%20request`);
}
