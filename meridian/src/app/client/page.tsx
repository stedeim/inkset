import { requireRole } from "@/modules/auth/current-user";

export default async function ClientHome() {
  const user = await requireRole("CLIENT");
  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">
        Good to see you, {user.fullName.split(" ")[0]}.
      </h1>
      <p className="mt-3 text-[var(--color-stone)]">
        Your dashboard is being prepared. Today’s plan, tracking, and your coach will appear here.
      </p>
    </div>
  );
}
