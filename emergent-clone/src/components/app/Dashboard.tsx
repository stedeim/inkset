"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { STARTER_PROMPTS } from "@/lib/data";
import {
  createProject,
  deleteProject,
  loadProjects,
  type Project,
} from "@/lib/projects";
import { getUser } from "@/lib/auth";

export function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const handled = useRef(false);

  // Auto-start a build if arriving with ?prompt= from the marketing hero.
  useEffect(() => {
    const incoming = params.get("prompt");
    if (incoming && !handled.current) {
      handled.current = true;
      const project = createProject(incoming);
      router.replace(`/app/build/${project.id}`);
    }
  }, [params, router]);

  useEffect(() => {
    const sync = () => setProjects(loadProjects());
    sync();
    window.addEventListener("emergent:projects", sync);
    return () => window.removeEventListener("emergent:projects", sync);
  }, []);

  function start(text: string) {
    const p = text.trim();
    if (!p) return;
    const project = createProject(p);
    router.push(`/app/build/${project.id}`);
  }

  const user = getUser();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {user ? `Hey ${user.name.split(" ")[0]},` : "Welcome,"} what are we
          building?
        </h1>
        <p className="mt-1.5 text-white/50">
          Describe your app and the agent team will design, build, and deploy it.
        </p>
      </div>

      {/* Prompt box */}
      <div className="glow-ring rounded-2xl border border-line bg-ink-850/80 p-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start(prompt);
          }}
          rows={3}
          placeholder="A CRM for a small real-estate team with a pipeline board and email reminders…"
          className="w-full resize-none bg-transparent px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="hidden text-xs text-white/35 sm:block">
            <kbd className="rounded border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px]">
              ⌘↵
            </kbd>{" "}
            to build
          </span>
          <button onClick={() => start(prompt)} className="btn btn-primary ml-auto">
            <Icon name="bolt" size={16} />
            Build it
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((s) => (
          <button
            key={s}
            onClick={() => start(s)}
            className="chip hover:border-brand-500/50 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Projects */}
      <div className="mt-14">
        <h2 className="text-lg font-semibold text-white">Your projects</h2>
        {projects.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-ink-850/40 p-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-line bg-ink-800 text-brand-300">
              <Icon name="grid" size={22} />
            </div>
            <p className="mt-4 text-white/60">
              No projects yet — your builds will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card group relative overflow-hidden transition-all hover:border-brand-500/40"
              >
                <Link href={`/app/build/${p.id}`}>
                  <div className={`h-24 bg-gradient-to-br ${p.accent}`}>
                    <div className="h-full w-full dot-grid opacity-30" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-white/50">
                      {p.prompt}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => deleteProject(p.id)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-ink-950/60 text-white/60 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
                  title="Delete"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const map = {
    live: ["Live", "text-accent-teal border-accent-teal/30 bg-accent-teal/10"],
    building: ["Building", "text-accent-amber border-accent-amber/30 bg-accent-amber/10"],
    draft: ["Draft", "text-white/50 border-line bg-ink-800"],
  } as const;
  const [label, cls] = map[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
