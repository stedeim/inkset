import Link from "next/link";
import { PLANS } from "@/lib/data";
import { Icon } from "@/components/Icon";

export function Pricing({ standalone = false }: { standalone?: boolean }) {
  return (
    <section id="pricing" className="scroll-mt-20 py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Start for a dollar
          </h2>
          <p className="mt-4 text-lg text-white/55">
            Every plan includes the full agent team and GitHub sync. Scale credits
            as you build.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl items-start gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.highlighted
                  ? "border-brand-500/60 bg-ink-850 glow-ring"
                  : "border-line bg-ink-850/60"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-white/50">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-white/45">{plan.cadence}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-brand-300">
                {plan.credits}
              </p>

              <Link
                href="/signup"
                className={`btn mt-6 w-full ${
                  plan.highlighted ? "btn-primary" : "btn-secondary"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 text-accent-teal">
                      <Icon name="check" size={16} />
                    </span>
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {standalone && (
          <p className="mt-10 text-center text-sm text-white/40">
            Need something custom?{" "}
            <Link href="/enterprise" className="text-brand-300 hover:underline">
              Talk to us about Enterprise →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
