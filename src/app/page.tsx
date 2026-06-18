import Link from "next/link";
import { RonoLogo } from "@/components/rono/brand";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const portals: Array<{
  title: string;
  desc: string;
  href: string;
  color: string;
  external?: boolean;
}> = [
  {
    title: "Super Admin Portal",
    desc: "Manage companies, limits, and platform access",
    href: "/super-admin/login",
    color: "from-violet-600 to-indigo-600",
  },
  {
    title: "Company Admin (Web)",
    desc: "Dashboard, LR approval, branches, drivers, reports",
    href: "/company/login",
    color: "from-blue-600 to-cyan-600",
  },
  {
    title: "Driver / Admin App (Native)",
    desc: "Android APK + iOS — see lr-mobile/README.md",
    href: "https://expo.dev/",
    color: "from-emerald-600 to-teal-600",
    external: true,
  },
];

export default async function HomePage() {
  // Surface a real QR sample link if one exists in the database, otherwise hide
  // the QR demo card so the home page never links to a 404.
  const sampleLR = await prisma.lRRequest
    .findFirst({
      where: { qrCode: { not: "" } },
      orderBy: { createdAt: "desc" },
      select: { qrCode: true },
    })
    .catch(() => null);

  const allPortals = sampleLR
    ? [
        ...portals,
        {
          title: "QR Landing Page",
          desc: "Public LR details when a consignee scans the QR code",
          href: `/qr/${sampleLR.qrCode}`,
          color: "from-amber-500 to-orange-600",
        },
      ]
    : portals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <RonoLogo />
          <p className="text-sm text-slate-500">Digital LR for Every Route</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            RonoHub LR Platform
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Digital Lorry Receipt management for transport companies — drivers create LRs,
            admins approve, PDFs with QR codes are generated automatically.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allPortals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              target={portal.external ? "_blank" : undefined}
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-block rounded-xl bg-gradient-to-r ${portal.color} px-3 py-1 text-xs font-semibold text-white`}
              >
                Launch
              </div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-violet-700">
                {portal.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{portal.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border bg-white p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Demo credentials</p>
          <ul className="mt-3 space-y-1">
            <li>Super Admin: <code>admin@ronohub.com</code> / <code>admin123</code></li>
            <li>Company Admin OTP: <code>9876543210</code> → OTP <code>123456</code></li>
            <li>Driver OTP: <code>9012345678</code> (Ravi) or <code>9988776655</code> (Suresh) → OTP <code>123456</code></li>
            <li>
              Native mobile app: see <code className="text-violet-700">1/lr-mobile/README.md</code>
            </li>
          </ul>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-slate-400">
        Empowered by Rayudu Group / RonoHub
      </footer>
    </div>
  );
}
