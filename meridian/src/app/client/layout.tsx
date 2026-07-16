import { requireRole } from "@/modules/auth/current-user";
import { AppHeader } from "@/components/AppHeader";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLIENT");
  return (
    <div className="min-h-screen">
      <AppHeader name={user.fullName} context="Membership" />
      <main className="mx-auto max-w-4xl px-8 py-10">{children}</main>
    </div>
  );
}
