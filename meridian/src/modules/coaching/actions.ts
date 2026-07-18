"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import type { Principal } from "@/modules/access/guard";
import { getCoachProfileId } from "./queries";
import {
  addMilestone,
  addPlanItem,
  addSessionNote,
  setMilestoneAchieved,
  setPlanItemCompletionByCoach,
} from "./service";

async function requireCoachPrincipal(): Promise<Principal> {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") redirect("/login");
  const coachProfileId = user.role === "COACH" ? await getCoachProfileId(db, user.id) : null;
  return { userId: user.id, role: user.role, coachProfileId: coachProfileId ?? undefined };
}

const planItemSchema = z.object({
  membershipId: z.string().min(1),
  kind: z.enum(["WORKOUT", "HABIT", "RECOVERY", "NUTRITION", "ROUTINE"]),
  title: z.string().trim().min(1).max(200),
  details: z.string().trim().max(1000).optional().default(""),
  scheduledFor: z.coerce.date(),
});

export async function addPlanItemAction(formData: FormData): Promise<void> {
  const principal = await requireCoachPrincipal();
  const parsed = planItemSchema.safeParse({
    membershipId: formData.get("membershipId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    details: formData.get("details") ?? "",
    scheduledFor: formData.get("scheduledFor"),
  });
  if (!parsed.success) return;

  await addPlanItem(db, principal, parsed.data);
  revalidatePath(`/coach/clients/${parsed.data.membershipId}`);
}

const noteSchema = z.object({
  membershipId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
  nextSteps: z.string().trim().max(2000).optional().default(""),
});

export async function addSessionNoteAction(formData: FormData): Promise<void> {
  const principal = await requireCoachPrincipal();
  const parsed = noteSchema.safeParse({
    membershipId: formData.get("membershipId"),
    body: formData.get("body"),
    nextSteps: formData.get("nextSteps") ?? "",
  });
  if (!parsed.success) return;

  await addSessionNote(db, principal, parsed.data);
  revalidatePath(`/coach/clients/${parsed.data.membershipId}`);
}

const milestoneSchema = z.object({
  membershipId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  targetDate: z.union([z.literal(""), z.coerce.date()]).transform((v) => (v === "" ? null : v)),
});

export async function addMilestoneAction(formData: FormData): Promise<void> {
  const principal = await requireCoachPrincipal();
  const parsed = milestoneSchema.safeParse({
    membershipId: formData.get("membershipId"),
    title: formData.get("title"),
    targetDate: formData.get("targetDate") ?? "",
  });
  if (!parsed.success) return;

  await addMilestone(db, principal, parsed.data);
  revalidatePath(`/coach/clients/${parsed.data.membershipId}`);
}

export async function toggleMilestoneAction(formData: FormData): Promise<void> {
  const principal = await requireCoachPrincipal();
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const achieved = formData.get("achieved") === "true";
  if (!milestoneId) return;

  await setMilestoneAchieved(db, principal, { milestoneId, achieved });
  if (membershipId) revalidatePath(`/coach/clients/${membershipId}`);
}

export async function setPlanCompletionByCoachAction(formData: FormData): Promise<void> {
  const principal = await requireCoachPrincipal();
  const planItemId = String(formData.get("planItemId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const parsed = z.enum(["COMPLETED", "SKIPPED", "PENDING"]).safeParse(formData.get("status"));
  if (!planItemId || !parsed.success) return;

  await setPlanItemCompletionByCoach(db, principal, { planItemId, status: parsed.data });
  if (membershipId) revalidatePath(`/coach/clients/${membershipId}`);
}
