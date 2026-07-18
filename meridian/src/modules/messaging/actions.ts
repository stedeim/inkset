"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/current-user";
import type { Principal } from "@/modules/access/guard";
import { getClientMembership } from "@/modules/membership/queries";
import { getCoachProfileId } from "@/modules/coaching/queries";
import { sendMessage } from "./service";

const bodySchema = z.string().trim().min(1).max(4000);

/** Client sends a message on their own thread. */
export async function sendClientMessageAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/login");

  const body = bodySchema.safeParse(formData.get("body"));
  if (!body.success) return;

  const membership = await getClientMembership(db, user.id);
  if (!membership) return;

  const principal: Principal = { userId: user.id, role: "CLIENT" };
  await sendMessage(db, principal, { membershipId: membership.id, body: body.data });
  revalidatePath("/client");
}

/**
 * Client requests an on-demand call. Only permitted for tiers whose policy
 * allows it (enforced here, not just hidden in the UI). Posts a flagged message
 * onto the coach thread.
 */
export async function requestCallAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/login");

  const membership = await getClientMembership(db, user.id);
  if (!membership) return;

  const { tierAllows } = await import("@/modules/tiers/policy");
  if (!tierAllows(membership.tier, "onDemandCalls")) return; // server-side gate

  const principal: Principal = { userId: user.id, role: "CLIENT" };
  await sendMessage(db, principal, {
    membershipId: membership.id,
    body: "📞 I'd like to request an on-demand call at your earliest convenience.",
  });
  revalidatePath("/client");
}

/** Coach sends a message on a managed client's thread. */
export async function sendCoachMessageAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") redirect("/login");

  const body = bodySchema.safeParse(formData.get("body"));
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!body.success || !membershipId) return;

  const coachProfileId = user.role === "COACH" ? await getCoachProfileId(db, user.id) : null;
  const principal: Principal = {
    userId: user.id,
    role: user.role,
    coachProfileId: coachProfileId ?? undefined,
  };
  await sendMessage(db, principal, { membershipId, body: body.data });
  revalidatePath(`/coach/clients/${membershipId}`);
}
