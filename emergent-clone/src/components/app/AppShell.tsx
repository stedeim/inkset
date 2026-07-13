"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { getUser, signOut, type User } from "@/lib/auth";
import { loadProjects, type Project } from "@/lib/projects";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const sync = () => {
      setUser(getUser());
      setProjects(loadProjects());
    };
    sync();
    window.addEventListener("emergent:auth", sync);
    window.addEventListener("emergent:projects", sync);
    return () => {
      window.removeEventListener("emergent:auth", sync);
      window.removeEventListener("emergent:projects", sync);
    };
  }, []);

  useEffect(() => {
    if (user === null) {
      const next = encodeURIComponent(
        pathname + (typeof window !== "undefined" ? window.location.search : ""),
      );
      router.replace(`/signup?next=${next}`);
    }
  }, [user, pathname, router]);

  if (user === undefined || user === null) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-white/50">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink-900/60 p-4 md:flex">
        <Logo />

        <Link href="/app" className="btn btn-primary mt-6 w-full">
          <Icon name="plus" size={16} />
          New build
        </Link>

        <div className="mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-white/35">
          Projects
        </div>
        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
          {projects.length === 0 && (
            <p className="px-2 py-3 text-sm text-white/35">
              No projects yet. Start your first build.
            </p>
          )}
          {projects.map((p) => {
            const active = pathname === `/app/build/${p.id}`;
            return (
              <Link
                key={p.id}
                href={`/app/build/${p.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-brand-500/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br ${p.accent} text-[11px] font-bold text-white`}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                <StatusDot status={p.status} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2 border-t border-line pt-4">
          <div className="rounded-xl border border-line bg-ink-850 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Credits</span>
              <span className="font-mono font-semibold text-brand-300">
                {user.credits}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${Math.min(100, user.credits)}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="mt-2.5 block text-center text-xs text-brand-300 hover:underline"
            >
              Upgrade plan
            </Link>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl px-1 py-1.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {user.name}
              </div>
              <div className="truncate text-xs text-white/40">{user.plan}</div>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="btn btn-ghost p-1.5"
              title="Sign out"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line bg-ink-900/60 px-4 py-3 md:hidden">
          <Logo />
          <Link href="/app" className="btn btn-primary">
            <Icon name="plus" size={16} />
            New
          </Link>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Project["status"] }) {
  const color =
    status === "live"
      ? "bg-accent-teal"
      : status === "building"
        ? "bg-accent-amber animate-pulse"
        : "bg-white/30";
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}
