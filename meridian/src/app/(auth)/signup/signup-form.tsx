"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "@/modules/auth/actions";
import { TIER_CAPABILITIES } from "@/modules/tiers/policy";

const initial: FormState = {};

const TIER_ORDER = ["TIER_1", "TIER_2", "TIER_3"] as const;
const TIER_PRICING: Record<(typeof TIER_ORDER)[number], string> = {
  TIER_1: "From $30,000 / year",
  TIER_2: "From $75,000 / year",
  TIER_3: "By invitation",
};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initial);
  const [tier, setTier] = useState<(typeof TIER_ORDER)[number]>("TIER_2");

  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">Request membership</h1>
      <p className="mt-2 text-sm text-[var(--color-stone)]">
        A private membership for your health and performance.
      </p>

      <form action={action} className="mt-8 space-y-5">
        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input id="fullName" name="fullName" autoComplete="name" className="field-input" />
          {state.fieldErrors?.fullName && (
            <p className="field-error">{state.fieldErrors.fullName}</p>
          )}
        </div>

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
            autoComplete="new-password"
            className="field-input"
          />
          <p className="mt-1.5 text-xs text-[var(--color-stone)]">At least 12 characters.</p>
          {state.fieldErrors?.password && (
            <p className="field-error">{state.fieldErrors.password}</p>
          )}
        </div>

        <fieldset>
          <legend className="field-label">Membership tier</legend>
          <input type="hidden" name="tier" value={tier} />
          <div className="space-y-2.5">
            {TIER_ORDER.map((key) => {
              const cap = TIER_CAPABILITIES[key];
              const selected = tier === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTier(key)}
                  aria-pressed={selected}
                  className="w-full rounded border p-4 text-left transition-colors"
                  style={{
                    borderColor: selected ? "var(--color-brass)" : "#e4ded4",
                    background: selected ? "rgba(176,141,87,0.06)" : "#fff",
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg text-[var(--color-ink)]">{cap.label}</span>
                    <span className="text-xs text-[var(--color-stone)]">{TIER_PRICING[key]}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-stone)]">{cap.positioning}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {state.error && <p className="field-error">{state.error}</p>}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Creating your membership…" : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-stone)]">
        Already a member?{" "}
        <Link href="/login" className="text-[var(--color-brass)] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
