import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/modules/auth/current-user";
import { getClientMembership, needsOnboarding } from "@/modules/membership/queries";
import { capabilitiesFor } from "@/modules/tiers/policy";
import { PRIMARY_GOAL_LABELS, type Goals } from "@/modules/intake/schema";

export default async function ClientHome() {
  const user = await requireRole("CLIENT");
  const membership = await getClientMembership(db, user.id);
  if (!membership) redirect("/login");
  if (needsOnboarding(membership)) redirect("/client/onboarding");

  const tier = capabilitiesFor(membership.tier);
  const goals = membership.intake?.goals as Goals | undefined;
  const coachName = membership.coach?.user.fullName;

  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">
        Good to see you, {user.fullName.split(" ")[0]}.
      </h1>
      <p className="mt-3 text-[var(--color-stone)]">
        Your program is taking shape. Today’s plan and trends will appear here.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="section-card">
          <p className="field-label">Membership</p>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{tier.label}</p>
          <p className="mt-1 text-sm text-[var(--color-stone)]">{tier.positioning}</p>
        </div>
        <div className="section-card">
          <p className="field-label">Your focus</p>
          <p className="font-serif text-2xl text-[var(--color-ink)]">
            {goals ? PRIMARY_GOAL_LABELS[goals.primaryGoal] : "—"}
          </p>
        </div>
        <div className="section-card">
          <p className="field-label">Your coach</p>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{coachName ?? "Being matched"}</p>
          <p className="mt-1 text-sm text-[var(--color-stone)]">
            Response within {tier.asyncResponseSlaHours}h
          </p>
        </div>
      </div>
    </div>
  );
}
