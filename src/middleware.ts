import { NextResponse, type NextRequest } from "next/server";

// AUTH BYPASSED FOR DEVELOPMENT
// To re-enable auth, replace this with the Supabase session-checking middleware.
export async function middleware(request: NextRequest) {
  // Redirect root to dashboard
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
