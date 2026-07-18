import { TESTIMONIALS } from "@/lib/data";

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
            Loved by builders
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Shipping, not scaffolding
          </h2>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.handle}
              className="card flex flex-col justify-between p-7 transition-colors hover:border-brand-500/30"
            >
              <blockquote className="text-lg leading-relaxed text-white/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {t.name}
                  </div>
                  <div className="text-sm text-white/45">
                    {t.role} · {t.handle}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
