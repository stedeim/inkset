"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "@/lib/auth";
import { createProject } from "@/lib/projects";
import { Logo } from "@/components/Logo";

// Demo bypass: instantly signs in a demo user (no signup form) and drops
// into the app. Optionally pass ?prompt=... to kick off a build immediately,
// e.g. /demo?prompt=A%20yoga%20studio%20booking%20site
function DemoBypass() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    signIn("demo@deimira.app", "Demo User");
    const prompt = params.get("prompt");
    const t = setTimeout(() => {
      if (prompt && prompt.trim()) {
        const project = createProject(prompt.trim());
        router.replace(`/app/build/${project.id}`);
      } else {
        router.replace("/app");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [router, params]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4 text-white/70">
        <Logo />
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Entering demo workspace…
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense>
      <DemoBypass />
    </Suspense>
  );
}
