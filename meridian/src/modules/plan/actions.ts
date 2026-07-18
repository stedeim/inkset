"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import { getClientMembership } from "@/modules/membership/queries";
import { setCompletion, submitCheckIn } from "./service";

async function requireClient() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/login");
  return user;
}

const completionSchema = z.object({
  planItemId: z.string().min(1),
  status: z.enum(["COMPLETED", "SKIPPED", "PENDING"]),
});

export async function toggleCompletionAction(formData: FormData): Promise<void> {
  const user = await requireClient();
  const parsed = completionSchema.safeParse({
    planItemId: formData.get("planItemId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await setCompletion(db, { clientId: user.id, ...parsed.data });
  revalidatePath("/client");
}

const optionalScale = z
  .union([z.literal(""), z.coerce.number().min(0).max(24)])
  .transform((v) => (v === "" ? null : v));

const checkInSchema = z.object({
  energy: optionalScale,
  sleepHours: optionalScale,
  mood: optionalScale,
});

export async function submitCheckInAction(formData: FormData): Promise<void> {
  const user = await requireClient();
  const membership = await getClientMembership(db, user.id);
  if (!membership) return;

  const parsed = checkInSchema.safeParse({
    energy: formData.get("energy") ?? "",
    sleepHours: formData.get("sleepHours") ?? "",
    mood: formData.get("mood") ?? "",
  });
  if (!parsed.success) return;

  await submitCheckIn(db, { clientId: user.id, membershipId: membership.id, ...parsed.data });
  revalidatePath("/client");
}
