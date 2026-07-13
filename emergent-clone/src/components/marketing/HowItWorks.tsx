import { AGENTS } from "@/lib/data";

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative scroll-mt-20 overflow-hidden py-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
            The agent pipeline
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Five specialists. One build.
          </h2>
          <p className="mt-4 text-lg text-white/55">
            Your prompt routes through a coordinated team, each owning a layer of
            the development lifecycle — from blueprint to live URL.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          {/* connecting line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-brand-500/60 via-line to-brand-500/20 md:hidden" />

          <ol className="grid gap-4 md:grid-cols-5">
            {AGENTS.map((a, i) => (
              <li
                key={a.id}
                className="card relative flex flex-col gap-3 p-5 md:items-center md:text-center"
              >
                <div className="flex items-center gap-3 md:flex-col">
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-2xl border border-line bg-ink-900 text-2xl ${a.color}`}
                  >
                    {a.glyph}
                  </span>
                  <div className="md:mt-1">
                    <span className="font-mono text-xs text-white/35">
                      0{i + 1}
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      {a.name}
                    </h3>
                    <p className={`text-xs font-medium ${a.color}`}>{a.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/50">
                  {a.blurb}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
