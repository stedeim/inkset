"use client";

// Client-side project store (localStorage). Stands in for a database.

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string; // which agent authored an assistant message
};

export type Project = {
  id: string;
  name: string;
  prompt: string;
  status: "building" | "live" | "draft";
  createdAt: number;
  accent: string;
  messages: ChatMessage[];
};

const KEY = "emergent:projects";

const ACCENTS = [
  "from-brand-500/30 to-accent-teal/20",
  "from-accent-pink/25 to-brand-500/20",
  "from-accent-teal/25 to-brand-400/20",
  "from-accent-amber/20 to-brand-500/20",
  "from-brand-400/25 to-accent-pink/20",
];

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function saveAll(projects: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(projects));
  window.dispatchEvent(new Event("emergent:projects"));
}

function slugName(prompt: string): string {
  const words = prompt.replace(/[^a-z0-9 ]/gi, "").split(/\s+/).filter(Boolean);
  const pick = words.slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1));
  const base = pick.join("") || "App";
  const suffix = ["ly", "io", "Flow", "Hub", "Kit"][base.length % 5];
  return base.length > 12 ? base.slice(0, 10) : base + suffix;
}

// Deterministic id (no Math.random / Date dependence issues in SSR)
let counter = 0;
function makeId(): string {
  counter += 1;
  const t =
    typeof performance !== "undefined" ? Math.floor(performance.now()) : counter;
  return `p_${t.toString(36)}_${counter.toString(36)}`;
}

export function createProject(prompt: string): Project {
  const projects = loadProjects();
  const project: Project = {
    id: makeId(),
    name: slugName(prompt),
    prompt,
    status: "building",
    createdAt: Date.now(),
    accent: ACCENTS[projects.length % ACCENTS.length],
    messages: [{ id: makeId(), role: "user", content: prompt }],
  };
  saveAll([project, ...projects]);
  return project;
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id);
}

export function updateProject(id: string, patch: Partial<Project>) {
  const projects = loadProjects();
  const next = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveAll(next);
}

export function appendMessage(id: string, msg: ChatMessage) {
  const projects = loadProjects();
  const next = projects.map((p) =>
    p.id === id ? { ...p, messages: [...p.messages, msg] } : p,
  );
  saveAll(next);
}

export function deleteProject(id: string) {
  saveAll(loadProjects().filter((p) => p.id !== id));
}

export { makeId };
