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
      <div className="flex min-h-screen items-center justify-center bg-[#2d2d4e]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#7b4fd4] border-t-white" />
          <p className="mt-4 text-sm font-bold text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#5a3dc8] via-[#4a2fb8] to-[#3a1fa0] p-12 text-white lg:flex">
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
        
        <RonoLogo className="relative z-10 text-white [&_span]:text-white" />
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            The smarter way to manage<br />transport LRs at scale.
          </h1>
          <p className="text-base font-semibold text-white/60">
            Control every company, executive and LR from one place.
          </p>
          <p className="text-sm font-semibold text-white/60">
            Super Admin Portal — Powered by RonoHub.
          </p>
        </div>
        <div className="relative z-10 flex gap-2">
          <span className="h-2 w-6 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-white/30" />
          <span className="h-2 w-2 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-[#f4f6fb] p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2d2d4e]">Welcome back</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#6b7280]">
              Sign in to access the Super Admin Portal. This portal is for RonoHub administrators only.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-bold text-[#2d2d4e]">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 rounded-lg border-[#e8edf5] bg-white px-4 text-sm font-semibold focus:border-[#7b4fd4] focus:ring-[#f0ebfc]"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-bold text-[#2d2d4e]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 rounded-lg border-[#e8edf5] bg-white px-4 text-sm font-semibold focus:border-[#7b4fd4] focus:ring-[#f0ebfc]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#7b4fd4] to-[#3b9fe8] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7b4fd4]/30 transition-all hover:shadow-xl hover:shadow-[#7b4fd4]/40 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In to Admin Portal"}
          </button>

          <div className="flex items-start gap-3 rounded-xl border-0 bg-[#ebf5fd] p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#3b9fe8]" />
            <div className="text-xs font-semibold leading-relaxed text-[#2d2d4e]">
              <p>
                This portal is restricted to Rayudu Group / RonoHub administrators.
                All login activity is monitored and logged.
              </p>
              <p className="mt-1 font-bold text-[#2d2d4e]">
                Unauthorised access is prohibited.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
