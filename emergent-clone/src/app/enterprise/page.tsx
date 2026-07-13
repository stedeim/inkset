import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Enterprise — Emergent",
  description:
    "Ship internal tools and customer apps at scale with SSO, RBAC, audit logs, and dedicated support.",
};

const BENEFITS = [
  {
    icon: "shield",
    title: "Security & compliance",
    body: "SSO/SAML, role-based access control, audit logs, and encryption in transit and at rest.",
  },
  {
    icon: "users",
    title: "Team workspaces",
    body: "Shared projects, pooled credits, and granular permissions across your whole org.",
  },
  {
    icon: "globe",
    title: "Bring your own cloud",
    body: "Deploy to your own infrastructure or VPC. Export everything to GitHub — you own the code.",
  },
  {
    icon: "gear",
    title: "Custom agents",
    body: "Tune the agent team to your stack, design system, and internal conventions.",
  },
];

export default function EnterprisePage() {
  return (
    <>
      <Navbar />
      <main className="pt-32">
        <section className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mx-auto">For teams & orgs</span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Ship software at <span className="gradient-text">scale</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
              Give every team a full engineering pod. Emergent Enterprise adds the
              security, control, and support your organization needs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary px-6 py-3 text-base">
                Talk to sales
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3 text-base">
                Compare plans
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-7">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-800 text-brand-300">
                  <Icon name={b.icon} size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {b.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-6 rounded-2xl border border-line bg-ink-850/60 p-8 sm:grid-cols-3">
              {[
                ["10x", "faster delivery"],
                ["99.9%", "uptime SLA"],
                ["SOC 2", "Type II ready"],
              ].map(([stat, label]) => (
                <div key={label} className="text-center">
                  <div className="text-4xl font-semibold text-white">{stat}</div>
                  <div className="mt-1 text-sm text-white/50">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="h-24" />
      </main>
      <Footer />
    </>
  );
}
