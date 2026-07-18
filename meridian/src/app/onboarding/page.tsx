import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/modules/auth/current-user";
import { getClientMembership, needsOnboarding } from "@/modules/membership/queries";
import { OnboardingFunnel } from "./funnel";

export default async function OnboardingPage() {
  const user = await requireRole("CLIENT");
  const membership = await getClientMembership(db, user.id);
  if (membership && !needsOnboarding(membership)) redirect("/client");

  return <OnboardingFunnel firstName={user.fullName.split(" ")[0]} />;
}
