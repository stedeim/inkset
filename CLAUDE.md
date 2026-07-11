# Inkset — Book Publishing Automation App

(Previously "BookForge" → "KDP Manuscript Studio". The on-disk folder is still `book-forge/` so existing paths keep working; the product name is **Inkset** (marketed as **Inkset.app**). Inside the UI, use just "Inkset".)

## Purpose
A Mac desktop app that takes a raw manuscript and produces a KDP-ready book package: edited manuscript, KDP-ready interior PDF + EPUB, wrap-around cover (front + spine + back) at correct dimensions, and back-cover copy.

Owner: Deimira. Output target: 12+ books/year (mix of fiction and non-fiction). Replaces $1000–3000/book in professional editor, formatter, and cover designer fees.

## Tech Stack
- Electron + React + TypeScript (Mac app shell).
- Tailwind CSS v4 (custom design tokens — no shadcn/ui anymore).
- TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) as the manuscript editor.
- Phosphor Icons (`@phosphor-icons/react`) — no Lucide, no Heroicons.
- Anthropic Claude API (editing passes).
- OpenAI DALL-E 3 (cover art).
- Puppeteer (PDF generation), `@lesjoursfr/html-to-epub` (EPUB), `mammoth` (DOCX parsing), `sharp` (dominant color + image normalization).

## Supported Input Formats
- Microsoft Word (.docx).
- Google Docs exported as .docx.
- Plain text / Markdown (.md, .txt).

## Folder Structure
- `src/main` — Electron main process (all Anthropic/OpenAI calls, Puppeteer, IPC handlers).
- `src/preload` — context-bridge surface for the renderer.
- `src/renderer` — React UI (three-column editorial layout).
- `prompts/` — Claude prompt templates.
- `output/edited/`, `output/interior-pdfs/`, `output/covers/` — generated artifacts (gitignored).
- `manuscripts/` — raw input files (gitignored).

## Design System — "Warm Antiquarian Modernism"

> **ALWAYS use the `ui-ux-pro-max` skill (installed at `.claude/skills/`) for any UI or design work in this repo** — planning, building, editing, or reviewing components, layouts, styling, spacing, typography, color, accessibility, or interaction/animation. This is a standing instruction: invoke the skill automatically before writing UI code or making a visual decision; do not wait to be asked. The sibling skills (`design-system`, `brand`, `design`, `ui-styling`, `slides`, `banner-design`) apply to their respective niches.
>
> **Constraint:** the skill knows 67 styles, most of which this app bans. Its guidance is subordinate to the house rules below — use it for spacing/state/accessibility/typography reasoning and per-stack (React/Tailwind) best practices, never to introduce a style, color, or effect this section prohibits. When the skill and this section conflict, this section wins.

Handcrafted editorial feel. No gradients, no glassmorphism, no backdrop-filter, no drop-shadows on cards (shadow is only on the manuscript canvas). No blues, purples, cyans anywhere.

**Colors (CSS tokens in `src/renderer/src/assets/main.css`):**
- Background: `#FAFAF9` (Off White) / `#1C1917` dark
- Surface: `#E7E5E4` (Parchment) / `#292524` dark
- Text: `#1C1917` / `#44403C` / `#A8A29E`
- Accent primary (gold): `#C8A96E`
- Accent hover (tobacco): `#8B5E3C`
- Warning (terracotta): `#D97B4F`
- Success (sage): `#4A6741`
- Border: `#D6D3D1`

Dark mode flips via `.dark` on `<html>`. The `TopNav` hosts the toggle.

**Typography:**
- Headings: **Cormorant Garamond** (app name, page titles, section headers only).
- UI / body: **DM Sans**.
- Monospace: **JetBrains Mono** (format codes, KDP spec numbers, file paths).

**Spacing:** 8-point grid (4px allowed for micro-adjustments).

**Component rules:** buttons use `.btn .btn-primary / btn-secondary / btn-ghost` classes from the base CSS; inputs use `.input-field`; panels use the `.panel` class. Icons are Phosphor at weight `regular`, 20px default.

**Canvas typography:** `.ms-canvas` — 56px horizontal padding, line-height 1.8, `box-shadow: 0 2px 24px rgba(28,25,23,0.08)`. First place a shadow is allowed in the app.

## Three-Column Layout (renderer)

| Zone | Width | Role |
|---|---|---|
| `TopNav` (`src/renderer/src/components/layout/TopNav.tsx`) | 48px tall | Ink-black bar, logo + app name in Cormorant Garamond, dark-mode toggle, "New Project" reset |
| `Sidebar` (`src/renderer/src/components/layout/Sidebar.tsx`) | 240px | Document metadata + auto-detected chapter list; click a chapter to scroll the canvas to it |
| `Canvas` (`src/renderer/src/components/layout/Canvas.tsx`) | fluid, max-width 720px | TipTap editor rendering the manuscript in editorial type; contenteditable so the user can make direct fixes after the pipeline runs. Paragraphs that differ from the original (post-edit) render with a gold left-border indicator |
| `Inspector` (`src/renderer/src/components/layout/Inspector.tsx`) | 320px | Collapsible sections: Overview (KDP checklist), Edit, Format, Cover, Blurb, Export |
| `StatusBar` (`src/renderer/src/components/layout/StatusBar.tsx`) | 32px tall | Word count, chapter count, `KDP Ready: NN/100` |

`AppContext` (`src/renderer/src/state/AppContext.tsx`) is a single `useReducer`-ish store that holds the manuscript, current canvas content, edit result, format meta, cover result, blurb, and inspector section state. All panels read/write through this context.

## Feature Map (renderer ↔ main process)

| Feature | Renderer entry | Main service | IPC channel(s) |
|---|---|---|---|
| Drop manuscript | `DropZone` in empty Canvas | `mammoth` in renderer for .docx | — |
| Chapter navigator | `Sidebar` + `detectChapterRefs` | — | — |
| Editing pipeline (grammar → style → clarity) | Inspector "Edit" section (`EditingPanel`) | `src/main/services/editingService.ts` (`editManuscript`) | `editing:start`, `editing:progress` (streams delta text), `editing:complete`, `editing:save` |
| Live edit feed | `EditingPanel` running view — scrolling monospace tail (3500-char cap), pass separators, blinking caret | Coalesces Claude stream deltas every ~50ms / 200 chars and sends them via `editing:progress` | `editing:progress.deltaText` |
| KDP interior format | Inspector "Format" section (`FormatPanel`) | `src/main/services/kdpFormatService.ts` | `kdp-format:run`, `kdp-format:reveal` |
| Cover designer (AI or BYO upload) | Inspector "Cover" section (`CoverPanel`) with AI/Upload toggle | `src/main/services/coverService.ts` — Claude concept → DALL-E 3 → panel PNGs → wrap PDF via Puppeteer; BYO path normalizes uploaded PNG/JPG/WebP via `sharp` and skips Claude+DALL-E | `cover:start`, `cover:reroll`, `cover:upload`, `cover:progress`, `cover:complete`, `cover:reveal` |
| 3D cover mockup | `Book3DMockup` inside Cover section result | — (pure CSS 3D: perspective + 6 faces + hover-to-rotate) | — |
| KDP readiness score | `computeKdpScore` in `src/renderer/src/lib/kdpScore.ts` — weighted checks for manuscript loaded, word-count minimum for trim, chapters detected, edit / format / cover / blurb complete | — | — |
| Blurb | Inspector "Blurb" section (plain textarea for now) | — | — |
| Export summary | Inspector "Export" section | — | — |

## Environment

`.env` at the project root (gitignored). Expected keys:
- `ANTHROPIC_API_KEY=sk-ant-…`
- `OPENAI_API_KEY=sk-…`

Never open `.env` in TextEdit — it mangles dotfiles (prior incident: file was saved as `forge`). Use `code` or `open -e`, or write content directly via a tool.

## Coding Conventions
- TypeScript strict mode.
- Functional React components with hooks.
- One component per file.
- Renderer layout components in `src/renderer/src/components/layout/`.
- Business logic in `src/renderer/src/lib/`.
- Backend services in `src/main/services/`.
- async/await over raw promises.
- Design tokens via CSS custom properties; dark-mode via `.dark` on `<html>`.

## Current State

### Status (2026-04-22)

**Parked at v2.0.0.** Dev-mode app is fully functional. Packaged `.app` has known bugs (listed below). Use dev mode (`npm run dev`) for now when running real manuscripts.

### Known Bugs (prioritized for next session)

1. **Drop cap CSS is splitting words apart in formatted output** — extracts mid-paragraph letters as drop caps, e.g. `possible` → `possi` + `b` + `le`. **Fix:** wrap only the first character of the first paragraph after each detected chapter heading in a `<span class="drop-cap">`, never use CSS `::first-letter`.
2. **Draft annotations like `[patched — seeds Lock-In]` are appearing in final output.** **Fix:** add a `cleanPreFormat(text)` strip-pass before PDF/EPUB generation.
3. **Packaged .app EPUB generation fails** because `@lesjoursfr/html-to-epub` tries to write into `app.asar` (read-only). **Fix:** redirect `tempDir` to `app.getPath('temp')` AND add the module to `asarUnpack` in electron-builder config.
4. **Paste (⌘V) doesn't work in the Settings modal of the packaged .app.** **Fix:** add a proper Electron application menu with standard Edit roles (undo/redo/cut/copy/paste/selectAll).

### How to Resume

Open Claude Code in this folder, read this CLAUDE.md, and work through the bugs above in order. Each one is a focused 30-minute fix.

### How to Use Now (Dev Mode)

```bash
cd ~/Documents/Cowork/apps/book-forge && npm run dev
```

The dev-mode app has all features working and is safe for real manuscripts as long as you don't need the packaged `.app` for distribution.

### Code-state note — read before re-fixing the bugs above (2026-04-22)

The four bugs listed were each attempted during sessions 2026-04-20 → 2026-04-22. Invariant tests in `scripts/test-drop-caps.mjs` pass for bugs #1 and #2 (zero drop caps with no heading, exactly one with a heading, `[patched …]` stripped). The packaged `release/mac-arm64/Inkset.app` passes extraction checks confirming the relevant functions (`wrapFirstCharAsDropCap`, `cleanPreFormat`, `tempJobDir`) and the non-`::first-letter` CSS are in the bundle. Bugs #3 and #4 have code fixes landed but were **not empirically confirmed end-to-end from the packaged .app** — the `tempJobDir` + `asarUnpack` change for #3 is in the bundle, and `src/main/menu.ts` with `Menu.setApplicationMenu(...)` for #4 is in `src/main/index.ts`.

Before re-fixing from scratch, next session should:
1. Generate a real PDF from the **current** packaged `.app` with the two test fixtures from `scripts/test-drop-caps.mjs` and confirm whether bug #1 / #2 actually reproduce on that build.
2. Generate an EPUB from the packaged `.app` and confirm whether bug #3 reproduces.
3. Launch the packaged `.app`, open Settings via ⌘K, and confirm whether ⌘V works in the OpenRouter field.

If any of those reproduce, the fix described above is still the right direction — but the existing attempt didn't catch the bug, so start by capturing the exact failing input before patching.

---

### v2.0.0 Packaging (historical)

**Inkset v2.0.0 packaged.** Distributable `.app` at `release/mac-arm64/Inkset.app` (380 MB) and installer at `release/Inkset-2.0.0-arm64.dmg` (132 MB, also a zip alongside). Unsigned build — first launch requires right-click → Open to clear Gatekeeper.

**Packaging specifics**
- `package.json`: `name: "inkset"`, `productName: "Inkset"`, `version: "2.0.0"`, `description: "AI-native book publishing for self-published authors"`, `homepage: "https://inkset.app"`.
- `electron-builder.yml`: `appId: com.deimira.inkset`, mac target `dmg + zip` arm64-only, category `public.app-category.productivity`, `hardenedRuntime: false`, `gatekeeperAssess: false`, `notarize: false`, `identity: null`, `npmRebuild: false`. `extraResources` ships `prompts/*.md` and `src/main/templates/*.html` into `Contents/Resources/`. `asarUnpack` keeps the `better-sqlite3` native binding outside the asar. Output directory `release/`.
- Custom icon at `build/icon.icns` — generated by `scripts/build-icon.mjs` from an inline SVG (Ink Black #1C1917 rounded-square, Antique Gold #C8A96E serif "I" drawn as geometric SVG paths so no fonts are needed). 10 iconset sizes compiled via `iconutil`. Regenerate with `node scripts/build-icon.mjs`.
- Build command: `npm run build && npx electron-builder --mac --arm64`.

**Runtime paths in packaged app** (via `src/main/util/paths.ts`)
- User env: `~/Library/Application Support/Inkset/.env` (chmod 600, written by the Settings modal). Loaded on startup before any service instantiates its API client. Falls back to shell `process.env`, then project-root `.env` in dev only.
- User outputs: `~/Documents/Inkset/{edited,interior-pdfs,covers}/` in packaged mode; project-root `output/` in dev.
- SQLite DB: `~/Library/Application Support/Inkset/inkset.db` in packaged; `output/inkset.db` in dev.

**Settings modal** (`src/renderer/src/components/SettingsModal.tsx`) — Cormorant heading, password-masked inputs with eye-toggle reveal, saves via `settings:set-keys` IPC, shows existing keys in masked form (`sk-ant-••••abc`). Opens on first launch if neither key is set, and from the command palette (`App → Open Settings`). IPC + env service at `src/main/services/envService.ts` + `src/main/ipc/settingsIpc.ts`.

---

Prior state (v1 + polish + v2 redesign, all still in place): Electron shell, three IPC domains (editing, kdpFormat, cover, versions, settings), three-column editorial layout (TopNav / Sidebar / Canvas / Inspector / StatusBar), TipTap manuscript canvas, auto-chapter navigator, KDP readiness score, Phosphor icon set, Warm Antiquarian palette, command palette (⌘K), version history SQLite snapshots with ⌘⇧S manual save. No IPC contracts changed during packaging — pipelines (edit → format → cover → blurb → export) still run exactly as before.

---

_Historical context preserved below for reference._

Week 4 complete + major redesign complete. App is **rebranded to Inkset**. The Electron shell, all IPC, and every main-process service (editingService, kdpFormatService, coverService) are unchanged — only the renderer was rebuilt.

**What's new in the redesign:**
- Three-column editorial layout (TopNav / Sidebar / Canvas / Inspector / StatusBar).
- Warm Antiquarian Modernism design system (Cormorant Garamond + DM Sans + JetBrains Mono, parchment surface, antique-gold accent, no gradients or glassmorphism).
- TipTap-powered manuscript canvas — contenteditable, renders as a physical page with the only drop-shadow in the app.
- Auto-chapter navigator in the sidebar with click-to-scroll.
- KDP readiness score (0–100) in the status bar and as a checklist in the inspector's Overview section.
- Phosphor Icons replace Lucide everywhere.
- Dark-mode toggle in TopNav (single `.dark` class on `<html>`) — theme state lives in `AppContext`, persists via `localStorage['inkset:theme']`.

**Polish pass additions (items 1/3/4 of the "million-dollar app" polish — items 2 and 5+ held for next pass):**
- **Command palette** (`src/renderer/src/components/CommandPalette.tsx`, `src/renderer/src/hooks/useCommandPalette.ts`). Opens on ⌘K / Ctrl+K (global listener) or via the `Search` button in the TopNav. Uses `cmdk` primitives. Grouped into Manuscript / Navigation / Tools / App. Fuzzy search via cmdk's built-in filter. Selected item has a gold left-border + tobacco-colored icon; group headings render in Cormorant small-caps. Navigation group auto-populates one `Jump to …` entry per detected chapter. Tools group opens the corresponding Inspector section (`openOnly`) and smooth-scrolls it into view via `data-inspector-section` attribute. App group toggles theme and shows a shortcuts cheat sheet.
- **Canvas ornamentation** — drop caps on the first paragraph after any `<h1>` / `<h2>` chapter heading (Cormorant Garamond 72pt, float left, Tobacco in light mode / Gold in dark), running headers (`Title · Author`, small caps, 10px DM Sans, 0.15em letter-spacing) emitted above each chapter heading when `formatMeta` has title+author, decorative **fleuron** for scene breaks (detected from standalone `***` / `---` paragraphs in the source text, rendered as a centered antique-gold SVG ornament), OpenType ligatures enabled via `font-feature-settings: 'liga' 1, 'dlig' 1, 'kern' 1`.
- **Paper grain** on the manuscript canvas — 3% opacity `feTurbulence` noise as a data-URL SVG, applied to `.ms-canvas::before`, `mix-blend-mode: multiply` in light / `screen` in dark. Barely perceptible — signals physicality.

**What's intentionally deferred from the spec:**
- Full inline word-level proofreading annotations (accept / reject per change) — currently surfaces as a gold left-border on changed paragraphs after the edit pipeline runs. Word-level decorations via ProseMirror are a next-iteration enhancement.
- Back-cover-copy generator (Claude-powered blurb variants) — the Blurb section currently accepts a typed/pasted blurb; the AI blurb generator is Week 5.

**Dev commands.** `npm run dev`; `npm run typecheck` clean.

Next action (Week 5 proper): AI back-cover-copy generator + final export pipeline that bundles the edited manuscript, interior PDF+EPUB, cover wrap PDF, and blurb into one per-book folder.

## Notes for Future Claude Code Sessions
- Always read this file first when a session starts in this folder.
- Never commit API keys to the repo. Use a `.env` file (already gitignored).
- Main-process changes require a dev-server restart; renderer changes hot-reload.
- Never introduce blues / purples / indigo / cyan; never use gradients, glassmorphism, or backdrop-filter; never use border-radius > 8px on cards/panels or > 6px on buttons.
