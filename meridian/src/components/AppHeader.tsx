import { logoutAction } from "@/modules/auth/actions";

/** Slim ink top bar shared by the client and coach surfaces. */
export function AppHeader({ name, context }: { name: string; context: string }) {
  return (
    <header className="flex items-center justify-between bg-[var(--color-ink)] px-8 py-3.5 border-b border-[rgba(176,141,87,0.22)]">
      <div className="flex items-baseline gap-3">
        <span className="text-sm uppercase tracking-[0.32em] text-[var(--color-brass)]">Meridian</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#8a837a]">{context}</span>
      </div>
      <div className="flex items-center gap-5">
        <span className="text-sm text-[#d6d0c4]">{name}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-[#a8a29b] underline-offset-4 transition-colors hover:text-[var(--color-ivory)] hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
