import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import { AccessError, assertCoachManagesMembership, type Principal } from "@/modules/access/guard";
import { getCoachProfileId, getMembershipDetail } from "@/modules/coaching/queries";
import { capabilitiesFor } from "@/modules/tiers/policy";
import { KIND_LABELS, KIND_OPTIONS } from "@/modules/plan/labels";
import {
  PRIMARY_GOAL_LABELS,
  TRAVEL_LABELS,
  type Constraints,
  type Goals,
  type Habits,
} from "@/modules/intake/schema";
import { isoDate } from "@/lib/dates";
import {
  addMilestoneAction,
  addPlanItemAction,
  addSessionNoteAction,
} from "@/modules/coaching/actions";
import { getThread } from "@/modules/messaging/queries";
import { markThreadRead } from "@/modules/messaging/service";
import { sendCoachMessageAction } from "@/modules/messaging/actions";
import { MessagesPanel } from "@/components/MessagesPanel";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") redirect("/login");

  const coachProfileId = user.role === "COACH" ? await getCoachProfileId(db, user.id) : null;
  const principal: Principal = {
    userId: user.id,
    role: user.role,
    coachProfileId: coachProfileId ?? undefined,
  };

  const m = await getMembershipDetail(db, membershipId);
  if (!m) notFound();
  try {
    assertCoachManagesMembership(principal, { coachId: m.coachId });
  } catch (e) {
    if (e instanceof AccessError) notFound();
    throw e;
  }

  const thread = await getThread(db, m.id);
  await markThreadRead(db, m.id, user.id);

  const tier = capabilitiesFor(m.tier);
  const goals = m.intake?.goals as Goals | undefined;
  const constraints = m.intake?.constraints as Constraints | undefined;
  const habits = m.intake?.currentHabits as Habits | undefined;
  const todayIso = isoDate(new Date());

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brass)]">{tier.label}</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">{m.client.fullName}</h1>
        <p className="mt-1 text-sm text-[var(--color-stone)]">
          {m.client.email} · {m.status.toLowerCase()}
        </p>
      </header>

      {/* Intake summary */}
      <section className="section-card">
        <h2 className="section-title">Intake</h2>
        {m.intake?.completedAt ? (
          <div className="mt-3 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="field-label">Primary focus</p>
              <p className="text-[var(--color-ink)]">
                {goals ? PRIMARY_GOAL_LABELS[goals.primaryGoal] : "—"}
              </p>
              <p className="mt-2 text-sm text-[var(--color-stone)]">{goals?.successLooksLike}</p>
            </div>
            <div>
              <p className="field-label">Constraints</p>
              <p className="text-sm text-[var(--color-ink)]">
                {constraints?.weeklyHours}h/week ·{" "}
                {constraints ? TRAVEL_LABELS[constraints.travelFrequency] : ""}
              </p>
              {constraints?.dietaryPreferences && (
                <p className="mt-1 text-sm text-[var(--color-stone)]">
                  Diet: {constraints.dietaryPreferences}
                </p>
              )}
              {constraints?.scheduleNotes && (
                <p className="mt-1 text-sm text-[var(--color-stone)]">{constraints.scheduleNotes}</p>
              )}
            </div>
            <div>
              <p className="field-label">Baseline</p>
              <p className="text-sm text-[var(--color-ink)]">
                Sleep {habits?.sleepHours}h · Training {habits?.trainingDaysPerWeek}×/wk
              </p>
              <p className="mt-1 text-sm text-[var(--color-stone)]">
                Nutrition {habits?.nutritionQuality}/5 · Stress {habits?.stressLevel}/5
              </p>
            </div>
          </div>
        ) : (
          <p className="section-hint">Client hasn’t completed onboarding yet.</p>
        )}
      </section>

      {/* Plan editor */}
      <section className="section-card">
        <h2 className="section-title">Plan</h2>
        <form action={addPlanItemAction} className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr_10rem_auto] sm:items-end">
          <input type="hidden" name="membershipId" value={m.id} />
          <div>
            <label className="field-label">Type</label>
            <select name="kind" className="field-input" defaultValue="WORKOUT">
              {KIND_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Item</label>
            <input name="title" className="field-input" placeholder="e.g. Zone 2 — 40 min" required />
          </div>
          <div>
            <label className="field-label">Date</label>
            <input name="scheduledFor" type="date" className="field-input" defaultValue={todayIso} />
          </div>
          <button type="submit" className="btn-primary sm:w-auto sm:px-5">Add</button>
        </form>

        <ul className="mt-5 space-y-2">
          {m.planItems.map((item) => {
            const status = item.completions[0]?.status ?? "PENDING";
            return (
              <li key={item.id} className="flex items-center justify-between border-b border-[#efeae2] pb-2 text-sm">
                <span>
                  <span className="text-[var(--color-brass)]">{KIND_LABELS[item.kind]}</span>{" "}
                  <span className="text-[var(--color-ink)]">{item.title}</span>
                </span>
                <span className="flex items-center gap-3 text-[var(--color-stone)]">
                  <span>{isoDate(item.scheduledFor)}</span>
                  <span
                    style={{
                      color:
                        status === "COMPLETED"
                          ? "var(--color-sage)"
                          : status === "SKIPPED"
                            ? "var(--color-warning, #b06a3f)"
                            : "var(--color-stone)",
                    }}
                  >
                    {status.toLowerCase()}
                  </span>
                </span>
              </li>
            );
          })}
          {m.planItems.length === 0 && <li className="section-hint">No plan items yet.</li>}
        </ul>
      </section>

      {/* Milestones */}
      <section className="section-card">
        <h2 className="section-title">Milestones</h2>
        <form action={addMilestoneAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="membershipId" value={m.id} />
          <div className="flex-1">
            <label className="field-label">Milestone</label>
            <input name="title" className="field-input" placeholder="e.g. Resting HR below 55" required />
          </div>
          <div>
            <label className="field-label">Target date</label>
            <input name="targetDate" type="date" className="field-input" />
          </div>
          <button type="submit" className="btn-primary sm:w-auto sm:px-5">Add</button>
        </form>
        <ul className="mt-4 space-y-1.5 text-sm">
          {m.milestones.map((ms) => (
            <li key={ms.id} className="flex justify-between">
              <span className="text-[var(--color-ink)]">{ms.title}</span>
              {ms.targetDate && (
                <span className="text-[var(--color-stone)]">by {isoDate(ms.targetDate)}</span>
              )}
            </li>
          ))}
          {m.milestones.length === 0 && <li className="section-hint">No milestones set.</li>}
        </ul>
      </section>

      {/* Session notes */}
      <section className="section-card">
        <h2 className="section-title">Session notes</h2>
        <form action={addSessionNoteAction} className="mt-3 space-y-3">
          <input type="hidden" name="membershipId" value={m.id} />
          <div>
            <label className="field-label">Note</label>
            <textarea name="body" className="field-input" placeholder="What was discussed, observations…" required />
          </div>
          <div>
            <label className="field-label">Next steps (optional)</label>
            <input name="nextSteps" className="field-input" placeholder="Actions before the next touchpoint" />
          </div>
          <button type="submit" className="btn-primary sm:w-auto sm:px-5">Save note</button>
        </form>
        <ul className="mt-5 space-y-3">
          {m.sessionNotes.map((note) => (
            <li key={note.id} className="border-b border-[#efeae2] pb-3">
              <p className="text-xs text-[var(--color-stone)]">{isoDate(note.createdAt)}</p>
              <p className="mt-1 text-sm text-[var(--color-ink)]">{note.body}</p>
              {note.nextSteps && (
                <p className="mt-1 text-sm text-[var(--color-brass)]">Next: {note.nextSteps}</p>
              )}
            </li>
          ))}
          {m.sessionNotes.length === 0 && <li className="section-hint">No notes yet.</li>}
        </ul>
      </section>

      <MessagesPanel
        title="Messages"
        hint={`Direct thread with ${m.client.fullName}`}
        messages={thread?.messages ?? []}
        viewerId={user.id}
        action={sendCoachMessageAction}
        membershipId={m.id}
        otherLabel={m.client.fullName}
      />
    </div>
  );
}
