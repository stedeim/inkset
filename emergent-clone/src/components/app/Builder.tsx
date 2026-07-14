"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/app/Markdown";
import { PreviewPane } from "@/components/app/PreviewPane";
import { AGENTS } from "@/lib/data";
import { spendCredit } from "@/lib/auth";
import {
  appendMessage,
  getProject,
  makeId,
  updateProject,
  type ChatMessage,
  type Project,
} from "@/lib/projects";

export function Builder({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [building, setBuilding] = useState(false);
  const [showPanelMobile, setShowPanelMobile] = useState(false);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load project
  useEffect(() => {
    const p = getProject(id);
    setProject(p ?? null);
    if (p) setMessages(p.messages);
  }, [id]);

  // Auto-run the first build if the last message is an unanswered user prompt
  useEffect(() => {
    if (!project || startedRef.current) return;
    const last = project.messages[project.messages.length - 1];
    if (last && last.role === "user") {
      startedRef.current = true;
      runAssistant(project.messages, /* firstBuild */ true);
    } else {
      startedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  async function runAssistant(history: ChatMessage[], firstBuild: boolean) {
    setBuilding(true);
    setStreaming("");
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // Ensure the agent animation runs for a believable minimum duration.
      const minBuild = firstBuild
        ? new Promise((r) => setTimeout(r, AGENTS.length * 4 * 520 + 400))
        : Promise.resolve();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      await minBuild;
    } catch (err) {
      acc =
        acc ||
        `_Sorry — the build agent couldn't be reached. ${
          err instanceof Error ? err.message : ""
        }_`;
    }

    const assistantMsg: ChatMessage = {
      id: makeId(),
      role: "assistant",
      content: acc,
    };
    appendMessage(id, assistantMsg);
    setMessages((m) => [...m, assistantMsg]);
    setStreaming("");
    setBuilding(false);

    if (firstBuild) {
      updateProject(id, { status: "live" });
      spendCredit(5);
      setProject((p) => (p ? { ...p, status: "live" } : p));
    }
  }

  function send() {
    const text = input.trim();
    if (!text || building) return;
    const userMsg: ChatMessage = { id: makeId(), role: "user", content: text };
    appendMessage(id, userMsg);
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    runAssistant(next, false);
  }

  if (project === undefined) {
    return (
      <div className="grid h-full place-items-center text-white/50">
        Loading project…
      </div>
    );
  }
  if (project === null) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-white/60">This project doesn&apos;t exist.</p>
          <Link href="/app" className="btn btn-primary mt-4">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh)] md:h-screen">
      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-line">
        <header className="flex items-center gap-3 border-b border-line px-5 py-3">
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${project.accent} text-[11px] font-bold text-white`}
          >
            {project.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-white">{project.name}</h1>
            <p className="truncate text-xs text-white/45">
              {building ? "Agents are building…" : "Chat to refine your app"}
            </p>
          </div>
          {/* Mobile: open the agent/preview panel (hidden on desktop where it's always visible) */}
          <button
            onClick={() => setShowPanelMobile(true)}
            className="btn btn-secondary shrink-0 p-2 lg:hidden"
            aria-label="Show build panel"
          >
            <Icon name={building ? "users" : "play"} size={16} />
            {building && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent-amber animate-pulse" />
            )}
          </button>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}
          {building && streaming && (
            <Message
              msg={{ id: "streaming", role: "assistant", content: streaming }}
            />
          )}
          {building && !streaming && (
            <div className="flex items-center gap-2 text-sm text-white/45">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              The agent team is spinning up…
            </div>
          )}
        </div>

        <div className="border-t border-line p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-ink-850 p-2 focus-within:border-brand-500/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              disabled={building}
              placeholder={
                building
                  ? "Building…"
                  : "Ask for a change — add a feature, tweak the design…"
              }
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={building || !input.trim()}
              className="btn btn-primary p-2.5"
              aria-label="Send"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview column (desktop) */}
      <div className="hidden w-[46%] max-w-2xl shrink-0 lg:block">
        <PreviewPane project={project} building={building} />
      </div>

      {/* Preview panel (mobile slide-over) */}
      {showPanelMobile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink-950 lg:hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold text-white">Build</span>
            <button
              onClick={() => setShowPanelMobile(false)}
              className="btn btn-ghost p-2"
              aria-label="Close build panel"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <PreviewPane project={project} building={building} />
          </div>
        </div>
      )}
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"
            fill="white"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-line bg-ink-850/60 px-4 py-2.5">
        <Markdown text={msg.content} />
      </div>
    </div>
  );
}
