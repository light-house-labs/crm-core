import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  // If Supabase Auth returns an error in the callback (e.g. database trigger blocked user)
  if (error) {
    // Redirect to the generic auth error page to hide specific DB errors
    return NextResponse.redirect(`${origin}/auth-error`);
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
       return NextResponse.redirect(`${origin}/auth-error`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth-error`);
}

