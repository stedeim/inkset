import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/modules/auth/current-user";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  return <LoginForm />;
}
