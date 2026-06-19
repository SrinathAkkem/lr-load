"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RonoLogo } from "@/components/rono/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ronohub.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      setRedirecting(true);
      router.push("/super-admin/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error");
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-300 border-t-white" />
          <p className="mt-4 text-sm font-medium text-violet-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 p-12 text-white lg:flex">
        <RonoLogo className="text-white [&_span]:text-white" />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            The smarter way to manage<br />transport LRs at scale.
          </h1>
          <p className="text-base text-violet-200/90">
            Control every company, driver and LR from one place.
          </p>
          <p className="text-sm font-medium text-violet-300">
            Super Admin Portal — Powered by RonoHub.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="h-1.5 w-8 rounded-full bg-white" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Sign in to access the Super Admin Portal. This portal is for RonoHub administrators only.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:from-violet-700 hover:via-violet-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In to Admin Portal"}
          </button>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="text-xs leading-relaxed text-slate-600">
              <p>
                This portal is restricted to Rayudu Group / RonoHub administrators.
                All login activity is monitored and logged.
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                Unauthorised access is prohibited.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
