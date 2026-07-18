import { Suspense } from "react";
import { Dashboard } from "@/components/app/Dashboard";

export default function AppHomePage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
