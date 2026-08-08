"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Every CTA on the public homepage funnels into this same logic: if a
 * company admin is already signed in, skip straight to their dashboard;
 * otherwise (including a stray super-admin session, which should never be
 * reachable from the public site) sign out and land on the company login
 * page, where "Register Now" covers new sign-ups.
 */
async function resolveLoginTarget(router: ReturnType<typeof useRouter>) {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const data = await res.json();
    if (data?.data?.authenticated && data.data.role === "company_admin") {
      router.push("/company/dashboard");
      return;
    }
    if (data?.data?.authenticated) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
  } catch {
    // Network hiccup — fall through to the login page, the safe default.
  }
  router.push("/company/login");
}

export function LoginButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await resolveLoginTarget(router);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
