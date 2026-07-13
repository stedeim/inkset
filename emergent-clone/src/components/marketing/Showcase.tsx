import { SHOWCASE } from "@/lib/data";
import { Icon } from "@/components/Icon";

export function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-20 py-24">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
              Built with Emergent
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              From idea to app gallery
            </h2>
          </div>
          <p className="text-white/55">
            Real product categories people ship in an afternoon.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.map((item) => (
            <article
              key={item.title}
              className="card group cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-500/40"
            >
              <div
                className={`relative h-40 bg-gradient-to-br ${item.accent} p-4`}
              >
                <div className="absolute inset-0 dot-grid opacity-30" />
                {/* fake browser chrome */}
                <div className="relative flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                </div>
                <div className="relative mt-4 space-y-2">
                  <div className="h-2 w-2/3 rounded bg-white/25" />
                  <div className="h-2 w-1/2 rounded bg-white/15" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/20" />
                    <div className="h-8 flex-1 rounded-lg bg-white/10" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <span className="text-xs font-medium text-brand-300">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50">{item.description}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-white/50 transition-all group-hover:border-brand-500/50 group-hover:text-white">
                  <Icon name="arrowRight" size={16} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
