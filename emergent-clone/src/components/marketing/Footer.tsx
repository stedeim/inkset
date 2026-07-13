import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      ["Features", "/#features"],
      ["How it works", "/#how"],
      ["Showcase", "/#showcase"],
      ["Pricing", "/pricing"],
      ["Enterprise", "/enterprise"],
    ],
  },
  {
    title: "Build",
    links: [
      ["Web apps", "/signup"],
      ["Mobile apps", "/signup"],
      ["Dashboards", "/signup"],
      ["Internal tools", "/signup"],
      ["SaaS", "/signup"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/#"],
      ["Blog", "/#"],
      ["Careers", "/#"],
      ["Changelog", "/#"],
      ["Contact", "/#"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Docs", "/#"],
      ["Community", "/#"],
      ["Templates", "/#showcase"],
      ["Status", "/#"],
      ["Support", "/#"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink-950">
      <div className="container-x py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              The agentic vibe-coding platform. Describe an idea, and a team of
              AI agents ships a production-ready app.
            </p>
            <div className="mt-5 flex gap-3">
              {["X", "in", "gh", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line text-xs font-semibold text-white/60 transition-colors hover:border-brand-500/50 hover:text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-sm text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Emergent clone. A demo build.</p>
          <div className="flex gap-6">
            <Link href="/#" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/#" className="hover:text-white">
              Terms
            </Link>
            <Link href="/#" className="hover:text-white">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
