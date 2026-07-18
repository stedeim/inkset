import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_20px_-6px_rgba(124,92,255,0.7)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"
            fill="white"
            fillOpacity="0.95"
          />
        </svg>
        <span className="absolute -inset-1 rounded-lg bg-brand-500/40 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        Deimira
      </span>
    </Link>
  );
}
