import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware skeleton. Route protection lands here in the auth step:
 *  - unauthenticated requests to /client or /coach → redirect to /login
 *  - role mismatch (client hitting /coach, or vice versa) → 404, so the app
 *    never confirms the existence of the other surface.
 *
 * Session verification is intentionally not wired up yet — that arrives with
 * the Auth.js integration in the next step.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/coach/:path*"],
};
