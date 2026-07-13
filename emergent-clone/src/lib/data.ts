// Content model for the marketing site + app.

export type Agent = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  color: string; // tailwind text color class
  glyph: string; // emoji/symbol
  tasks: string[]; // sample streamed tasks used in the builder simulation
};

export const AGENTS: Agent[] = [
  {
    id: "architect",
    name: "Architect",
    role: "Plans the system",
    blurb:
      "Reads your prompt, resolves ambiguities, and produces a technical blueprint — data models, API contracts, and page structure.",
    color: "text-brand-300",
    glyph: "◇",
    tasks: [
      "Analyzing product requirements",
      "Defining data models & entities",
      "Designing REST API contracts",
      "Mapping page & component hierarchy",
    ],
  },
  {
    id: "designer",
    name: "Designer",
    role: "Owns the UI/UX",
    blurb:
      "Generates layout, typography, color systems, spacing rules, and responsive breakpoints for a polished interface.",
    color: "text-accent-pink",
    glyph: "❍",
    tasks: [
      "Selecting typographic scale",
      "Building color & spacing tokens",
      "Composing responsive layouts",
      "Wiring interaction states",
    ],
  },
  {
    id: "developer",
    name: "Developer",
    role: "Writes the code",
    blurb:
      "Implements the frontend and backend with production-grade React, FastAPI, and MongoDB — real, portable code you own.",
    color: "text-accent-teal",
    glyph: "⟨⟩",
    tasks: [
      "Scaffolding React frontend",
      "Implementing FastAPI endpoints",
      "Wiring MongoDB collections",
      "Adding auth & validation",
    ],
  },
  {
    id: "integration",
    name: "Integration",
    role: "Connects services",
    blurb:
      "Hooks up payments, auth providers, email, and third-party APIs by understanding what you want to connect.",
    color: "text-accent-amber",
    glyph: "⚯",
    tasks: [
      "Configuring Stripe payments",
      "Adding email notifications",
      "Connecting third-party APIs",
      "Securing API keys",
    ],
  },
  {
    id: "qa",
    name: "QA & Deploy",
    role: "Tests & ships",
    blurb:
      "Runs the app, catches errors, self-heals, then deploys to production hosting with a live URL and GitHub sync.",
    color: "text-brand-400",
    glyph: "▲",
    tasks: [
      "Running integration tests",
      "Self-healing runtime errors",
      "Syncing code to GitHub",
      "Deploying to production",
    ],
  },
];

export type Feature = {
  title: string;
  description: string;
  icon: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Prompt to production",
    description:
      "Describe your app in plain English. Agents design, build, test, and deploy it end-to-end — no boilerplate, no setup.",
    icon: "sparkles",
  },
  {
    title: "You own the code",
    description:
      "Real React, Next.js, FastAPI and MongoDB. Sync to GitHub, download, and host anywhere. Zero lock-in.",
    icon: "github",
  },
  {
    title: "Full-stack, batteries included",
    description:
      "Authentication, databases, role-based access, and APIs are wired up for you — production-ready from the first build.",
    icon: "stack",
  },
  {
    title: "One-click deploy",
    description:
      "Ship to managed hosting with a live URL and custom domains. Scale as users arrive without touching infra.",
    icon: "rocket",
  },
  {
    title: "Edit by prompt or by hand",
    description:
      "Refine layouts, tweak logic, and add features with follow-up prompts — or drop into the code directly.",
    icon: "wand",
  },
  {
    title: "Integrations that just work",
    description:
      "Stripe, email, OAuth, and third-party APIs connect by description. Real functionality without the plumbing.",
    icon: "plug",
  },
];

export type Plan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  credits: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    name: "Hobby",
    price: "$1",
    cadence: "first month, then $20/mo",
    tagline: "Kick the tires and ship your first app.",
    credits: "100 credits / month",
    features: [
      "Full agent team",
      "Unlimited public projects",
      "GitHub sync",
      "Community support",
    ],
    cta: "Start for $1",
  },
  {
    name: "Pro",
    price: "$200",
    cadence: "per month",
    tagline: "For builders shipping real products.",
    credits: "750 credits / month",
    features: [
      "Everything in Hobby",
      "1M-token context window",
      "Custom AI agents",
      "Priority builds",
      "Private projects",
      "One-click production deploy",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Teams",
    price: "$250",
    cadence: "per seat / month",
    tagline: "Collaborate and ship together.",
    credits: "Pooled team credits",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Role-based access control",
      "SSO & audit logs",
      "Dedicated support",
    ],
    cta: "Start a team",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  handle: string;
  role: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I described a marketplace over coffee and had a working app with auth and payments before my cup was empty. Wild.",
    name: "Priya Nair",
    handle: "@priyabuilds",
    role: "Solo founder",
  },
  {
    quote:
      "The fact that it syncs real React + FastAPI to my GitHub sold me. No lock-in, and the code is actually clean.",
    name: "Marcus Webb",
    handle: "@mwebb_dev",
    role: "Staff Engineer",
  },
  {
    quote:
      "We prototype client apps 10x faster. The agent team handles the boring 80% so we focus on the product.",
    name: "Lena Fischer",
    handle: "@lena_ships",
    role: "Agency lead",
  },
  {
    quote:
      "It self-heals errors mid-build. Watching the QA agent fix its own bug and redeploy is genuinely magic.",
    name: "Diego Alvarez",
    handle: "@diegocodes",
    role: "Indie hacker",
  },
];

export type ShowcaseItem = {
  title: string;
  category: string;
  description: string;
  accent: string; // gradient classes
};

export const SHOWCASE: ShowcaseItem[] = [
  {
    title: "Ledgerly",
    category: "SaaS Dashboard",
    description: "Invoicing & analytics with Stripe billing.",
    accent: "from-brand-500/30 to-accent-teal/20",
  },
  {
    title: "PlateShare",
    category: "Marketplace",
    description: "Home-cook food marketplace with reviews.",
    accent: "from-accent-pink/25 to-brand-500/20",
  },
  {
    title: "FitPulse",
    category: "Mobile App",
    description: "Workout tracker with social challenges.",
    accent: "from-accent-teal/25 to-brand-400/20",
  },
  {
    title: "DeskFlow",
    category: "Internal Tool",
    description: "Team helpdesk with SLA automation.",
    accent: "from-accent-amber/20 to-brand-500/20",
  },
  {
    title: "Roamly",
    category: "Booking Site",
    description: "Vacation rentals with map search.",
    accent: "from-brand-400/25 to-accent-pink/20",
  },
  {
    title: "InboxIQ",
    category: "AI Tool",
    description: "Email triage assistant with rules engine.",
    accent: "from-accent-teal/20 to-brand-500/25",
  },
];

export const STARTER_PROMPTS = [
  "A recipe-sharing marketplace with user accounts and reviews",
  "An internal helpdesk with tickets, SLAs, and a Slack integration",
  "A habit tracker with streaks, reminders, and a weekly digest email",
  "A booking site for a yoga studio with Stripe payments",
  "A CRM for a small real-estate team with a pipeline board",
];
