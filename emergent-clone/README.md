# Emergent Clone

A functional clone of [emergent.sh](https://emergent.sh) — the agentic vibe-coding
platform — built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and
**Tailwind CSS**.

## What's included

**Marketing site**
- Landing page: prompt-driven hero, feature grid, the 5-agent pipeline ("How it works"),
  a built-with-Emergent showcase, testimonials, pricing, and CTA.
- `/pricing` — full pricing tiers + FAQ.
- `/enterprise` — enterprise positioning page.

**Working app**
- Mock auth (`/login`, `/signup`) — client-side session, any email works.
- `/app` dashboard — describe an app, see your projects, delete them.
- `/app/build/[id]` — the builder: a chat interface where a **team of five AI agents**
  (Architect, Designer, Developer, Integration, QA & Deploy) streams a build in
  real time next to a live agent-activity panel, app preview, and generated code.

## AI builds — real or simulated

The builder streams from `POST /api/chat`, which picks a provider in this order:

1. **OpenRouter** — if `OPENROUTER_API_KEY` is set. OpenAI-compatible, so it can route
   to Claude, GPT, Llama, and more. Choose any model via `OPENROUTER_MODEL`
   (default `anthropic/claude-3.5-sonnet`). Get a key at
   [openrouter.ai/keys](https://openrouter.ai/keys).
2. **Anthropic** — if `ANTHROPIC_API_KEY` is set (uses the official SDK).
3. **Built-in simulation** — no key needed, so the whole experience works offline.

See `.env.example` for all variables.

## Run it

```bash
npm install
cp .env.example .env   # optional — add ANTHROPIC_API_KEY for real AI builds
npm run dev            # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Notes

- Auth and projects are persisted to `localStorage` — this is a front-end demo, not a
  production backend. No real user data leaves the browser.
- Design system: dark UI, violet/indigo accent, Inter + JetBrains Mono.
