# Meridian

A private, concierge-style health & performance coaching platform for high-net-worth
individuals. Positioning is outcome-led — energy, consistency, transformation — not
technology. (Working name; easy to rename.)

## Stack

| Concern    | Choice                                        | Why |
|------------|-----------------------------------------------|-----|
| Framework  | Next.js 15 (App Router) + React 19 + TS       | One codebase for premium UI + typed server logic; Server Actions keep client/coach data on the server |
| Database   | PostgreSQL + Prisma                           | Relational integrity for memberships/plans/audit; typed queries; first-class migrations |
| Auth       | Auth.js v5 (credentials + argon2), DB sessions | Secure email/password now; SSO/MFA are additive later. Server-side sessions are auditable |
| Styling    | Tailwind CSS v4                               | Design tokens in CSS; fast path to a restrained, premium look |
| Validation | Zod                                          | One schema layer for env, intake forms, and API input |
| Testing    | Vitest                                        | Fast unit tests for domain logic (tier policy, access guards) |

## Architecture

Next.js is the full stack. The browser renders premium client/coach surfaces;
all reads and writes to client health data happen in **Server Actions and Route
Handlers**, never directly from the client. This keeps three guarantees central
to the product:

1. **Client ↔ coach separation.** A client only ever reaches their own
   `Membership`; a coach only reaches memberships assigned to them. Enforced by
   `src/modules/access/guard.ts` on every mutation, and by middleware at the
   route boundary.
2. **Tier enforcement.** `src/modules/tiers/policy.ts` is the single source of
   truth for what each tier can do (SLAs, call cadence, priority messaging,
   private office). UI and permissions read the same definitions.
3. **Auditability.** Every coach mutation against client data writes an
   `AuditLog` row — the foundation for a HIPAA-like posture later.

### Layout

```
meridian/
├── prisma/
│   └── schema.prisma          # Users, memberships, intake, plans, messaging, audit
├── src/
│   ├── app/                   # Routes (App Router). Route groups per surface:
│   │                          #   (marketing) · (auth) · client · coach
│   ├── components/            # Reusable premium UI primitives
│   ├── modules/               # Feature/domain logic
│   │   ├── access/            # Authorization guards (client/coach separation)
│   │   └── tiers/             # Tier capability policy
│   ├── lib/                   # env validation, prisma client, shared utils
│   └── middleware.ts          # Route protection boundary
└── tests/                     # Vitest unit tests for domain logic
```

## Getting started

```bash
cd meridian
cp .env.example .env.local     # fill DATABASE_URL + AUTH_SECRET
npm install
npm run db:migrate             # requires a running Postgres
npm run dev
```

## Authentication

Email/password with argon2id hashing and **revocable, database-backed sessions**
(the raw token is never stored — only its SHA-256 hash). Self-serve signup creates
a `CLIENT` with a tiered membership; coaches/admins are provisioned via seed/admin.
Route protection is two-layered: a cheap cookie gate in Edge middleware, plus full
token validation and role enforcement in the `/client` and `/coach` layouts (Node).

Demo accounts (after `npm run db:seed`): `coach@meridian.app` / `client@meridian.app`
— passwords in `prisma/seed.ts`.

## Roadmap

- [x] Project setup & structure
- [x] Auth & user model with tiers (argon2, revocable sessions, audit trail)
- [ ] Onboarding / intake flow (Zod-validated, consent capture)
- [ ] Client dashboard (today's plan, tracking, trends, messaging)
- [ ] Coach workspace (roster, plan editing, notes, milestones)
- [ ] Tier-specific UX + premium styling pass
