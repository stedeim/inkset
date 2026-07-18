import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/modules/auth/current-user";
import { getClientMembership, needsOnboarding } from "@/modules/membership/queries";
import { capabilitiesFor, tierAllows } from "@/modules/tiers/policy";
import { PRIMARY_GOAL_LABELS, type Goals } from "@/modules/intake/schema";
import { getConsistency, getPlanForDay, getRecentCheckIns } from "@/modules/plan/queries";
import { getThread } from "@/modules/messaging/queries";
import { markThreadRead } from "@/modules/messaging/service";
import { sendClientMessageAction, requestCallAction } from "@/modules/messaging/actions";
import { MessagesPanel } from "@/components/MessagesPanel";
import { PlanSection } from "./plan-section";
import { TrackingSection } from "./tracking-section";

export default async function ClientHome() {
  const user = await requireRole("CLIENT");
  const membership = await getClientMembership(db, user.id);
  if (!membership) redirect("/login");
  if (needsOnboarding(membership)) redirect("/onboarding");

  const today = new Date();
  const [plan, checkIns, consistency, thread] = await Promise.all([
    getPlanForDay(db, membership.id, today),
    getRecentCheckIns(db, membership.id, 7, today),
    getConsistency(db, membership.id, 7, today),
    getThread(db, membership.id),
  ]);
  await markThreadRead(db, membership.id, user.id);

  const tier = capabilitiesFor(membership.tier);
  const goals = membership.intake?.goals as Goals | undefined;
  const coachName = membership.coach?.user.fullName;

  return (
    <div>
      <h1 className="font-serif text-4xl text-[var(--color-ink)]">
        Good to see you, {user.fullName.split(" ")[0]}.
      </h1>

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

      <PlanSection items={plan} />
      <TrackingSection checkIns={checkIns} consistency={consistency} today={today} />

      <section className="mt-8 section-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="field-label">Your access</p>
            <p className="text-sm text-[var(--color-ink)]">
              {tier.callsPerMonth} coaching {tier.callsPerMonth === 1 ? "call" : "calls"} / month ·{" "}
              {tierAllows(membership.tier, "priorityMessaging") ? "Priority messaging" : "Async messaging"}{" "}
              within {tier.asyncResponseSlaHours}h
            </p>
          </div>
          {tierAllows(membership.tier, "onDemandCalls") && (
            <form action={requestCallAction}>
              <button type="submit" className="btn-primary" style={{ width: "auto", paddingInline: "1.4rem" }}>
                Request a call
              </button>
            </form>
          )}
        </div>
      </section>

      <div className="mt-4">
        <MessagesPanel
          title="Your coach"
          hint={`${tierAllows(membership.tier, "priorityMessaging") ? "Priority messaging" : "Messages"} · typically within ${tier.asyncResponseSlaHours}h`}
          messages={thread?.messages ?? []}
          viewerId={user.id}
          action={sendClientMessageAction}
          otherLabel="You"
        />
      </div>
    </div>
  );
}
