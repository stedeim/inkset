import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { readSessionCookie } from "./cookies";
import { validateSession, type SessionUser } from "./session";

/**
 * Resolve the signed-in user for the current request, or null. Memoized per
 * request via React `cache` so multiple components can call it without repeat
 * database reads. Does not write cookies (server components cannot).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionCookie();
  const session = await validateSession(db, token);
  return session?.user ?? null;
});

/** Require any authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require a specific role. A role mismatch redirects to the user's own home
 * rather than exposing the existence of the other surface.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}

export function homePathFor(role: Role): string {
  return role === "CLIENT" ? "/client" : "/coach";
}
