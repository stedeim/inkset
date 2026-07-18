"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/modules/auth/actions";

const initial: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--color-stone)]">Sign in to your membership.</p>

      <form action={action} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className="field-input" />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
          />
          {state.fieldErrors?.password && (
            <p className="field-error">{state.fieldErrors.password}</p>
          )}
        </div>

        {state.error && <p className="field-error">{state.error}</p>}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-stone)]">
        New here?{" "}
        <Link href="/signup" className="text-[var(--color-brass)] underline-offset-4 hover:underline">
          Request membership
        </Link>
      </p>
    </div>
  );
}
