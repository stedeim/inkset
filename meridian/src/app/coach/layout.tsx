import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/current-user";
import { AppHeader } from "@/components/AppHeader";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  // Coaches and admins may both reach the coach workspace.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "CLIENT") redirect("/client");

  return (
    <div className="min-h-screen">
      <AppHeader name={user.fullName} context="Concierge workspace" />
      <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
    </div>
  );
}
