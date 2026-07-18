"use client";

// Lightweight mock auth — a client-side session persisted to localStorage.
// This stands in for a real auth provider for the demo.

export type User = {
  name: string;
  email: string;
  plan: string;
  credits: number;
};

const KEY = "emergent:user";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, name?: string): User {
  const user: User = {
    email,
    name: name || email.split("@")[0].replace(/[^a-z]/gi, " ").trim() || "Builder",
    plan: "Hobby",
    credits: 100,
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("emergent:auth"));
  return user;
}

export function signOut() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("emergent:auth"));
}

export function spendCredit(n = 1) {
  const u = getUser();
  if (!u) return;
  u.credits = Math.max(0, u.credits - n);
  localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("emergent:auth"));
}
