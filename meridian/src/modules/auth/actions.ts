"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, homePathFor } from "./current-user";
import { clearSessionCookie, readSessionCookie, setSessionCookie } from "./cookies";
import { createSession, invalidateSession } from "./session";
import { loginSchema, signupSchema } from "./schemas";
import { authenticate, registerClient } from "./service";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

async function requestContext() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

/** Flatten a Zod error into a { field: message } map for the form. */
function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    tier: formData.get("tier"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const result = await registerClient(db, parsed.data);
  if (!result.ok) {
    return { fieldErrors: { email: "An account with this email already exists" } };
  }

  const { token, expiresAt } = await createSession(db, result.userId, await requestContext());
  await setSessionCookie(token, expiresAt);
  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const result = await authenticate(db, parsed.data);
  if (!result.ok) return { error: "Incorrect email or password" };

  const { token, expiresAt } = await createSession(db, result.userId, await requestContext());
  await setSessionCookie(token, expiresAt);

  const user = await db.user.findUnique({ where: { id: result.userId }, select: { role: true } });
  redirect(homePathFor(user!.role));
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionCookie();
  if (token) await invalidateSession(db, token);
  await clearSessionCookie();
  redirect("/login");
}

export async function currentUserRole() {
  return (await getCurrentUser())?.role ?? null;
}
