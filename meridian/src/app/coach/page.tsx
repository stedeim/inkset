import { getCurrentUser } from "@/modules/auth/current-user";

export default async function CoachHome() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">Concierge workspace</h1>
      <p className="mt-3 text-[var(--color-stone)]">
        Welcome, {user?.fullName}. Your client roster and coaching tools will appear here.
      </p>
    </div>
  );
}
