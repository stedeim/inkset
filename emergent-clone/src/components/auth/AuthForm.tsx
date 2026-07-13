"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { signIn } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const next = params.get("next") || "/app";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Mock auth — no real backend.
    signIn(email, isSignup ? name : undefined);
    router.push(next);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            {isSignup
              ? "Start building in seconds. No credit card to try."
              : "Sign in to your Emergent workspace."}
          </p>

          <div className="mt-6 space-y-2.5">
            <button className="btn btn-secondary w-full">
              <Icon name="github" size={18} />
              Continue with GitHub
            </button>
            <button className="btn btn-secondary w-full">
              Continue with Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-white/35">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {isSignup && (
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Ada Lovelace"
                type="text"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              type="email"
              required
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-2 w-full"
            >
              {loading
                ? "One moment…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
              {!loading && <Icon name="arrowRight" size={16} />}
            </button>
          </form>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
            Demo build — mock authentication. Any email works and nothing is sent
            to a server.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-white/50">
          {isSignup ? "Already have an account?" : "New to Emergent?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-brand-300 hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 transition-colors focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
