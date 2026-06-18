"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RonoLogo, RonoGradientButton } from "@/components/rono/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ronohub.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Login failed");
        return;
      }
      toast.success("Welcome back!");
      router.push("/super-admin/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 p-12 text-white lg:flex">
        <RonoLogo className="text-white [&_span]:text-white" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            The smarter way to manage transport LRs at scale.
          </h1>
          <p className="mt-4 text-lg text-violet-200">
            Super Admin Portal — Powered by RonoHub. Control every company, driver and LR from one place.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="h-1.5 w-8 rounded-full bg-white" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to access the Super Admin Portal. This portal is for RonoHub administrators only.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <RonoGradientButton type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In to Admin Portal"}
          </RonoGradientButton>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            This portal is restricted to Rayudu Group / RonoHub administrators. All login activity is monitored and logged.
          </div>
        </form>
      </div>
    </div>
  );
}
