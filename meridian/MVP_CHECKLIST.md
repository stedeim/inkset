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

- [x] **M1 — Messaging (client ↔ coach).** Guarded `sendMessage`/`markThreadRead` service
  (client → own thread; coach → managed thread; admin bypass), thread + unread queries,
  client + coach server actions, a shared `MessagesPanel` on the client dashboard and the
  coach client-detail page, mark-as-read on view. 5 guard tests (allow/deny/admin/unknown).

- [x] **M2 — Tier enforcement in the UI.** Client dashboard shows an access summary
  (calls/month, priority vs async messaging, SLA hours from `capabilitiesFor`); the "Request a
  call" affordance is gated to tiers with `onDemandCalls` — enforced server-side in
  `requestCallAction`, not just hidden. Messaging panel hint reflects priority status.

- [x] **M3 — Coach abilities round-out.** The managing coach can mark a milestone achieved /
  reopen it and complete/reopen a plan item on the client's behalf, from the client-detail page.
  Both guarded by `assertCoachManagesMembership` and audited. 3 new guard tests (allow/deny/unknown).

- [x] **M4 — Premium styling pass on the logged-in app.** Ink top bar with a gold Meridian
  wordmark (echoes the funnel), gold small-caps page eyebrows (date on the client dashboard,
  "Concierge workspace" for the coach), Cormorant headings throughout, and tabular numerics on
  stats (SLA, calls/month, consistency, roster count). Warm/light — the deliberate contrast to
  the dark acquisition world. No new dependencies.

- [x] **M5 — Final pass.** Full typecheck + tests + build verified green; README "Current
  state" section added summarizing the finished MVP; loop stopped.

_Last updated by the loop: M5 complete — MVP done. 42 tests, typecheck clean, build green. Loop stopped._
