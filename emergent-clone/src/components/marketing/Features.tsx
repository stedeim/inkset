import { FEATURES } from "@/lib/data";
import { Icon } from "@/components/Icon";

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
            Everything, handled
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A full engineering team,
            <br className="hidden sm:block" /> in one prompt box
          </h2>
          <p className="mt-4 text-lg text-white/55">
            No scaffolding, no DevOps, no glue code. Emergent handles the entire
            lifecycle so you can focus on the idea.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card group relative overflow-hidden p-6 transition-all duration-300 hover:border-brand-500/40 hover:bg-ink-800/70"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-800 text-brand-300 transition-colors group-hover:border-brand-500/50 group-hover:text-brand-200">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {f.description}
              </p>
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/0 blur-2xl transition-all duration-300 group-hover:bg-brand-500/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
