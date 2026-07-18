# Meridian — MVP definition of done (autonomous build loop)

This file is the **durable source of truth** for the hourly build loop. Each run:
1. Read this file. Pick the first unchecked item (top to bottom).
2. Implement it fully: code + unit tests where logic warrants.
3. Verify: `npm run typecheck`, `npm test`, `npm run build` must all pass.
4. Commit + push to `claude/health-coaching-platform-l7yi8e`; check the item off here in the same commit.
5. When **all** items are checked, run the full verification once more, post a final
   summary to the user, and delete the cron trigger (stop the loop).

**Guardrails**
- Do NOT provision a hosted database or spend money — that awaits explicit user approval.
- Keep the design system: warm dashboard / dark funnel; no blues/purples/gradients.
- If an item is ambiguous or needs a product decision, leave it unchecked, note why, and
  move to the next item rather than guessing on something irreversible.
- Ignore the recurring Vercel `[vc]` build-failure comments on the PR — they are the
  pre-existing Inkset root-directory builds, unrelated to `meridian/`.

## Requirements traceability (from the product brief)
- Onboarding & intake ✅ · Client dashboard (plan/tracking) ✅ · Coach workspace ✅
- Security/privacy: auth, revocable sessions, client/coach separation, audit ✅
- Premium acquisition: immersive onboarding + membership application ✅
- **Remaining for MVP** ↓

## Checklist

- [ ] **M1 — Messaging (client ↔ coach).** MessageThread/Message model already exists.
  Add: guarded `sendMessage`/`markThreadRead` service (client → own thread; coach → managed
  thread; admin bypass), queries for the thread, client + coach server actions, a message
  panel on the client dashboard and on the coach client-detail page, unread indicator.
  Tests: send allow/deny by ownership. This is a core MVP flow — highest priority.

- [ ] **M2 — Tier enforcement in the UI.** Use `tierAllows`/`capabilitiesFor` to reflect tier
  differences where the member sees them: show the async response SLA and priority-messaging
  status on the messaging panel; gate an "Request a call" affordance to tiers with
  `onDemandCalls`; surface `callsPerMonth`. Add a small `tierAllows`-driven test if logic added.

- [ ] **M3 — Coach abilities round-out.** Let the managing coach mark a milestone achieved
  (toggle, audited) and mark a plan item complete on the client's behalf. Guarded + audited;
  test the new guard path.

- [ ] **M4 — Premium styling pass on the logged-in app.** Elevate the client dashboard and
  coach workspace to match the caliber of the funnel: Cormorant headings, refined spacing,
  a quieter TopNav, tabular numerics on stats, considered empty states. Keep it warm/light
  (the deliberate contrast to the dark acquisition world). No new dependencies.

- [ ] **M5 — Final pass.** Full typecheck + tests + build green; README "Current state" and
  roadmap updated to reflect the finished MVP; then stop the loop.

_Last updated by the loop: (initialized)_
