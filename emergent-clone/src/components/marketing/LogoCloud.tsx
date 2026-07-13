const STACK = ["React", "Next.js", "FastAPI", "MongoDB", "Expo", "Stripe", "GitHub"];

export function LogoCloud() {
  return (
    <section className="border-y border-line/60 bg-ink-950/50 py-10">
      <div className="container-x">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/35">
          Ships real code on a stack you already trust
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {STACK.map((s) => (
            <span
              key={s}
              className="text-lg font-semibold text-white/40 transition-colors hover:text-white/70"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
