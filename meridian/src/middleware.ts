import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/modules/auth/constants";

/**
 * Edge middleware: a cheap gate that redirects unauthenticated requests away
 * from protected areas based on cookie presence alone. It deliberately does NOT
 * hit the database (Prisma cannot run on the Edge) — full token validation and
 * role enforcement happen in the protected layouts, which run on Node.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/coach/:path*", "/onboarding"],
};
