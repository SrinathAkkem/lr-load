import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ChangePasswordCard } from "./change-password-card";
import { Settings, ShieldCheck, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/super-admin/login");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0ebfc] to-[#e8f5fd]">
          <Settings className="h-5 w-5 text-[#7b4fd4]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">
            Manage your platform admin account.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#2d2d4e]">Account</h3>
            <p className="text-xs font-semibold text-[#6b7280]">
              Identity used for sign-in and audit attribution.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Display Name" value={me?.name ?? session.name} />
              <Field
                label="Role"
                value="Super Admin"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
              <Field
                label="Email"
                value={me?.email ?? "—"}
                icon={<Mail className="h-3.5 w-3.5" />}
              />
              <Field
                label="Mobile"
                value={me?.mobile ? `+91 ${me.mobile}` : "—"}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <Field
                label="Joined"
                value={
                  me?.createdAt
                    ? me.createdAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
              />
            </dl>
          </div>

          <ChangePasswordCard />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#2d2d4e]">Platform info</h3>
            <p className="text-xs font-semibold text-[#6b7280]">
              Read-only platform identifiers.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <ReadOnlyRow label="App" value="RonoHub LR Platform" />
              <ReadOnlyRow label="Region" value="India / IST" />
              <ReadOnlyRow label="Audit retention" value="365 days" />
            </dl>
          </div>

          <div className="rounded-2xl border-0 bg-[#fef3e0] p-6 text-sm font-semibold text-[#2d2d4e] shadow-sm">
            <p className="font-bold">Need to onboard a new company?</p>
            <p className="mt-1 text-xs">
              Use the <strong>Companies</strong> tab to create a tenant. The
              company gets its own LR code, quota, and admin login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        {icon}
        {value}
      </dd>
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
