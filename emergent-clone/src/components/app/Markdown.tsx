import * as React from "react";

// Minimal, safe markdown renderer for assistant messages.
// Supports: ### headings, - bullets, **bold**, `code`, and paragraphs.

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flush = () => {
    if (bullets.length) {
      const items = [...bullets];
      blocks.push(
        <ul key={`ul-${key++}`} className="my-2 space-y-1.5">
          {items.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-white/75">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
              <span>{inline(b, `li-${key}-${i}`)}</span>
            </li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    flush();
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h-${key++}`}
          className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wide text-brand-300"
        >
          {inline(line.slice(4), `h-${key}`)}
        </h3>,
      );
    } else if (line.trim() === "") {
      // paragraph break — skip, spacing handled by block margins
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="my-1.5 text-sm leading-relaxed text-white/80">
          {inline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flush();

  return <div>{blocks}</div>;
}
