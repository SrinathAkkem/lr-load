import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * The bare root path is intentionally not a marketing page. It just routes
 * the visitor to the right portal based on their session, and falls back to
 * the company login (which is the most common entry point) when signed out.
 *
 * Demo / sample credentials are deliberately NOT shown here — this is a
 * production-grade application and listing them on a public page is a
 * security smell. Internal operators use the dedicated portal URLs.
 */
export default async function HomePage() {
  const session = await getSession();
  if (session?.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }
  if (session?.role === "company_admin") {
    redirect("/company/dashboard");
  }
  redirect("/company/login");
}
