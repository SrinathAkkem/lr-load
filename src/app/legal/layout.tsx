import Link from "next/link";
import { RonoLogo } from "@/components/rono/brand";
import { LegalNav } from "@/components/rono/legal-nav";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-gradient-sidebar px-4 py-4 text-white sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <RonoLogo className="text-white [&_span]:text-white" />
          <Link
            href="/company/login"
            className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      <LegalNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
