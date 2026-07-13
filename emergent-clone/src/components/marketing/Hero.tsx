"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { STARTER_PROMPTS, AGENTS } from "@/lib/data";

export function Hero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function start(text: string) {
    const p = text.trim();
    if (!p) return;
    router.push(`/app?prompt=${encodeURIComponent(p)}`);
  }

  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-dark [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />

      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#how"
            className="animate-fade-up chip mx-auto hover:border-brand-500/50 hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-glow" />
            Now with a 5-agent build pipeline
            <Icon name="arrowRight" size={13} />
          </a>

          <h1
            className="animate-fade-up mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            Describe it. <span className="gradient-text">Ship it.</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-5 max-w-xl text-pretty text-lg text-white/60"
            style={{ animationDelay: "120ms" }}
          >
            A coordinated team of AI agents designs, codes, tests, and deploys a
            production-ready full-stack app — from a single prompt. No coding
            required.
          </p>

          {/* Prompt box */}
          <div
            className="animate-fade-up mx-auto mt-9 max-w-2xl"
            style={{ animationDelay: "180ms" }}
          >
            <div className="glow-ring group relative rounded-2xl border border-line bg-ink-850/80 p-2 backdrop-blur">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start(prompt);
                }}
                rows={3}
                placeholder="Build a recipe marketplace with user accounts, reviews, and Stripe checkout…"
                className="w-full resize-none bg-transparent px-4 py-3 text-left text-[15px] text-white placeholder:text-white/35 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1">
                <span className="hidden text-xs text-white/35 sm:block">
                  Press{" "}
                  <kbd className="rounded border border-line bg-ink-800 px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘↵
                  </kbd>{" "}
                  to build
                </span>
                <button
                  onClick={() => start(prompt)}
                  className="btn btn-primary ml-auto"
                >
                  <Icon name="bolt" size={16} />
                  Build it
                </button>
              </div>
            </div>

            {/* starter chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {STARTER_PROMPTS.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => start(s)}
                  className="chip max-w-full truncate hover:border-brand-500/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* agent row */}
          <div
            className="animate-fade-up mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3"
            style={{ animationDelay: "240ms" }}
          >
            {AGENTS.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 text-sm text-white/45"
              >
                <span className={`text-base ${a.color}`}>{a.glyph}</span>
                {a.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
