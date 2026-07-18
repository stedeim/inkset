import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";

/**
 * Cookie helpers for the session token. The cookie is httpOnly (invisible to
 * JavaScript), Secure in production, and SameSite=Lax to blunt CSRF while still
 * allowing top-level navigation into the app.
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
