import { logoutAction } from "@/modules/auth/actions";

/** Slim top bar shared by the client and coach surfaces. */
export function AppHeader({ name, context }: { name: string; context: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[#e4ded4] bg-[var(--color-ivory)] px-8 py-4">
      <div className="flex items-baseline gap-3">
        <span className="text-sm uppercase tracking-[0.3em] text-[var(--color-brass)]">Meridian</span>
        <span className="text-xs text-[var(--color-stone)]">{context}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-ink)]">{name}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-[var(--color-stone)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
