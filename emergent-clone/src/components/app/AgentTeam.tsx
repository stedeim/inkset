"use client";

import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/data";
import { Icon } from "@/components/Icon";

type Phase = "idle" | "running" | "done";

export function AgentTeam({ running }: { running: boolean }) {
  // index of the agent currently working; -1 when idle, AGENTS.length when done
  const [active, setActive] = useState(-1);
  const [taskIdx, setTaskIdx] = useState(0);

  useEffect(() => {
    if (!running) {
      setActive(-1);
      setTaskIdx(0);
      return;
    }
    setActive(0);
    setTaskIdx(0);
    let agent = 0;
    let task = 0;
    const timer = setInterval(() => {
      task += 1;
      const tasks = AGENTS[agent]?.tasks.length ?? 0;
      if (task >= tasks) {
        agent += 1;
        task = 0;
        if (agent >= AGENTS.length) {
          setActive(AGENTS.length);
          clearInterval(timer);
          return;
        }
        setActive(agent);
      }
      setTaskIdx(task);
    }, 520);
    return () => clearInterval(timer);
  }, [running]);

  return (
    <div className="space-y-2">
      {AGENTS.map((a, i) => {
        const phase: Phase =
          active > i || active >= AGENTS.length
            ? "done"
            : active === i
              ? "running"
              : "idle";
        return (
          <div
            key={a.id}
            className={`rounded-xl border p-3 transition-colors ${
              phase === "running"
                ? "border-brand-500/50 bg-brand-500/5"
                : "border-line bg-ink-850/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-900 text-sm ${a.color}`}
              >
                {a.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {a.name}
                  </span>
                  <StatusIcon phase={phase} />
                </div>
                <div className="truncate text-xs text-white/45">
                  {phase === "running"
                    ? a.tasks[Math.min(taskIdx, a.tasks.length - 1)]
                    : phase === "done"
                      ? "Complete"
                      : a.role}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusIcon({ phase }: { phase: Phase }) {
  if (phase === "done")
    return (
      <span className="text-accent-teal">
        <Icon name="check" size={15} />
      </span>
    );
  if (phase === "running")
    return (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
    );
  return <span className="h-1.5 w-1.5 rounded-full bg-white/20" />;
}
