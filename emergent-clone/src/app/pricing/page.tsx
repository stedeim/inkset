import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Pricing } from "@/components/marketing/Pricing";

export const metadata: Metadata = {
  title: "Pricing — Deimira",
  description:
    "Simple, credit-based pricing. Start for $1. Every plan includes the full AI agent team and GitHub sync.",
};

const FAQ = [
  {
    q: "What is a credit?",
    a: "Credits are consumed as the agent team works — building, editing, and deploying your app. Larger builds and deploys use more credits.",
  },
  {
    q: "Do I own the code?",
    a: "Yes. Everything is real React, Next.js, FastAPI, and MongoDB. Sync it to GitHub, download it, and host it anywhere. No lock-in.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrade, downgrade, or top up credits from your dashboard. Changes are prorated.",
  },
  {
    q: "Is there a free trial?",
    a: "Your first month of Hobby is $1, which includes 100 credits — enough to build and deploy your first app.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Pricing standalone />

        <section className="pb-24">
          <div className="container-x mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight">
              Frequently asked
            </h2>
            <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-ink-850/50">
              {FAQ.map((item) => (
                <details key={item.q} className="group p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-white">
                    {item.q}
                    <span className="text-brand-300 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
