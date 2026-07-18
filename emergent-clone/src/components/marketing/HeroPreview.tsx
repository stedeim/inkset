import { AGENTS } from "@/lib/data";

// A static, high-fidelity "product shot" of the builder — makes the hero read
// as a real, shipping product rather than a marketing promise. Pure CSS/JSX.
export function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-5xl">
      {/* ambient glow behind the window */}
      <div className="pointer-events-none absolute -inset-x-10 -top-8 bottom-0 -z-10 rounded-[40px] bg-gradient-to-b from-brand-600/25 via-brand-600/5 to-transparent blur-2xl" />

      <div className="glow-ring overflow-hidden rounded-2xl border border-line bg-ink-900/90 backdrop-blur">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-ink-850/80 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex items-center gap-2 rounded-md bg-ink-900 px-3 py-1 font-mono text-[11px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
            ledgerly.deimira.app
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          {/* left: chat */}
          <div className="space-y-4 border-b border-line p-5 md:border-b-0 md:border-r">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-3.5 py-2 text-sm text-white">
                A SaaS dashboard with Stripe billing and team seats
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"
                    fill="white"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1 space-y-2 rounded-2xl rounded-tl-sm border border-line bg-ink-850/60 px-3.5 py-3">
                <p className="text-sm font-medium text-white">
                  Building your SaaS dashboard
                </p>
                <div className="space-y-1.5 text-xs text-white/60">
                  <p className="text-brand-300">BUILD PLAN</p>
                  <p>• Data models, auth, and Stripe billing wired up</p>
                  <p>• Responsive dashboard with team-seat management</p>
                  <p>• Tested, self-healed, and deployed live</p>
                </div>
                <p className="pt-1 text-xs text-white/45">
                  <span className="font-medium text-white/70">Live</span> · code
                  synced to GitHub
                  <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-blink bg-brand-400" />
                </p>
              </div>
            </div>
          </div>

          {/* right: agent team */}
          <div className="space-y-2 p-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Agent team</span>
              <span className="text-xs text-accent-teal">Shipped in 47s</span>
            </div>
            {AGENTS.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${
                  i === AGENTS.length - 1
                    ? "border-brand-500/50 bg-brand-500/5"
                    : "border-line bg-ink-850/40"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line bg-ink-900 text-sm ${a.color}`}
                >
                  {a.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white">{a.name}</div>
                  <div className="truncate text-[11px] text-white/40">
                    {a.role}
                  </div>
                </div>
                {i === AGENTS.length - 1 ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-accent-teal"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
