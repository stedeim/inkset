import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/modules/auth/current-user";
import { MembershipApplication } from "./membership";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  return <MembershipApplication />;
}
