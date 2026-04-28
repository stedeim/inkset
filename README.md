# Inkset.app

An Electron + React + TypeScript app that takes a raw manuscript and produces a KDP-ready book package: edited manuscript, print-ready interior PDF + EPUB, wrap-around cover, and back-cover copy.

The on-disk folder remains `book-forge/` so existing paths keep working; the product name is **Inkset**.

## Setup

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY and OPENAI_API_KEY
```

## Development

```bash
npm run dev
```

## Type checks

```bash
npm run typecheck
```

## Build (macOS)

```bash
npm run build:mac
```

## Layout

- `src/main` — Electron main process (Anthropic + OpenAI calls, Puppeteer, IPC).
- `src/preload` — context-bridge API surfaced to the renderer.
- `src/renderer` — React UI (three-column editorial layout: sidebar / canvas / inspector).
- `prompts/` — Claude prompt templates for each editing pass.
- `output/` — generated artifacts (gitignored).
- `manuscripts/` — raw input manuscripts (gitignored).
