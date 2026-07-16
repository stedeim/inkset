import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brass)]">Meridian</p>
      <h1 className="mt-6 font-serif text-5xl leading-tight text-[var(--color-ink)]">
        Your health and performance, managed with the same care as everything else that matters.
      </h1>
      <p className="mt-6 max-w-lg text-lg text-[var(--color-stone)]">
        A private membership. More energy, better consistency, and a routine you can actually keep —
        guided by a coach who knows you.
      </p>
      <div className="mt-10 flex items-center gap-6">
        <Link
          href="/signup"
          className="rounded bg-[var(--color-ink)] px-6 py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[#2a2521]"
        >
          Request membership
        </Link>
        <Link
          href="/login"
          className="text-sm text-[var(--color-brass)] underline-offset-4 hover:underline"
        >
          Member sign in
        </Link>
      </div>
    </main>
  );
}
