"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import { getClientMembership } from "@/modules/membership/queries";
import { intakeSchema } from "./schema";
import { saveIntake } from "./service";

export type IntakeFormState = { fieldErrors?: Record<string, string>; error?: string };

export async function submitIntakeAction(
  _prev: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/login");

  const membership = await getClientMembership(db, user.id);
  if (!membership) return { error: "We couldn't find your membership. Please contact your concierge." };

  const raw = {
    goals: {
      primaryGoal: formData.get("primaryGoal"),
      successLooksLike: formData.get("successLooksLike"),
    },
    constraints: {
      weeklyHours: formData.get("weeklyHours"),
      travelFrequency: formData.get("travelFrequency"),
      dietaryPreferences: formData.get("dietaryPreferences") ?? "",
      scheduleNotes: formData.get("scheduleNotes") ?? "",
    },
    currentHabits: {
      sleepHours: formData.get("sleepHours"),
      trainingDaysPerWeek: formData.get("trainingDaysPerWeek"),
      nutritionQuality: formData.get("nutritionQuality"),
      stressLevel: formData.get("stressLevel"),
    },
    consent: formData.get("consent") === "on",
  };

  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[issue.path.length - 1] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  await saveIntake(db, { membershipId: membership.id, actorId: user.id, input: parsed.data });
  redirect("/client");
}
