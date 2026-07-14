import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
      <Logo />
      <p className="mt-10 font-mono text-sm text-brand-300">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        This page didn&apos;t ship
      </h1>
      <p className="mx-auto mt-4 max-w-md text-white/55">
        The route you&apos;re looking for doesn&apos;t exist yet. Head back home and
        describe what you want to build.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary px-6 py-3 text-base">
          <Icon name="arrowRight" size={18} />
          Back home
        </Link>
        <Link href="/app" className="btn btn-secondary px-6 py-3 text-base">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
