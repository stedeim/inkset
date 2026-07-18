import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import { getCoachProfileId, getRoster } from "@/modules/coaching/queries";
import { capabilitiesFor } from "@/modules/tiers/policy";
import { PRIMARY_GOAL_LABELS, type Goals } from "@/modules/intake/schema";

export default async function CoachHome() {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") redirect("/login");

  const coachProfileId = user.role === "COACH" ? await getCoachProfileId(db, user.id) : null;
  const roster = await getRoster(db, { userId: user.id, role: user.role, coachProfileId });

  return (
    <div>
      <p className="page-eyebrow">Concierge workspace</p>
      <h1 className="mt-3 font-serif text-4xl text-[var(--color-ink)]">Your clients</h1>
      <p className="mt-2 text-[var(--color-stone)]">
        <span className="tnum">{roster.length}</span> {roster.length === 1 ? "member" : "members"} under your care.
      </p>

      <ul className="mt-8 space-y-2">
        {roster.map((m) => {
          const goals = m.intake?.goals as Goals | undefined;
          const tier = capabilitiesFor(m.tier);
          return (
            <li key={m.id}>
              <Link
                href={`/coach/clients/${m.id}`}
                className="section-card flex items-center justify-between gap-4 transition-colors hover:border-[var(--color-brass)]"
              >
                <div>
                  <p className="font-serif text-xl text-[var(--color-ink)]">{m.client.fullName}</p>
                  <p className="text-sm text-[var(--color-stone)]">
                    {tier.label} ·{" "}
                    {goals ? PRIMARY_GOAL_LABELS[goals.primaryGoal] : "Onboarding pending"}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: m.status === "ACTIVE" ? "rgba(74,103,65,0.12)" : "#f0ece5",
                    color: m.status === "ACTIVE" ? "var(--color-sage)" : "var(--color-stone)",
                  }}
                >
                  {m.status.toLowerCase()}
                </span>
              </Link>
            </li>
          );
        })}
        {roster.length === 0 && (
          <li className="section-hint">No clients assigned yet.</li>
        )}
      </ul>
    </div>
  );
}
