import Link from "next/link";
import { Icon } from "@/components/Icon";

export function CTA() {
  return (
    <section className="py-24">
      <div className="container-x">
        <div className="noise glow-ring relative overflow-hidden rounded-3xl border border-brand-500/40 bg-gradient-to-b from-ink-800 to-ink-900 px-8 py-16 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[100px]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Your next app is one prompt away
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
              Join builders shipping real, production-ready software with a team of
              AI agents. Start for a dollar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary px-6 py-3 text-base">
                Start building
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link
                href="/pricing"
                className="btn btn-secondary px-6 py-3 text-base"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
