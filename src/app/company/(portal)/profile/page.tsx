"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/media-url";
import { Pencil, ImageUp } from "lucide-react";

interface FormState {
  name: string;
  address: string;
  gstNumber: string;
  logoUrl: string;
  stampUrl: string;
  lrCode: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const INITIAL: FormState = {
  name: "",
  address: "",
  gstNumber: "",
  logoUrl: "",
  stampUrl: "",
  lrCode: "",
};

export default function CompanyProfilePage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [savedForm, setSavedForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [pw, setPw] = useState<PasswordForm>({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const c = d.data;
          const loaded: FormState = {
            name: c.name ?? "",
            address: c.address ?? "",
            gstNumber: c.gstNumber ?? "",
            logoUrl: c.logoUrl ?? "",
            stampUrl: c.stampUrl ?? "",
            lrCode: c.lrCode ?? "",
          };
          setForm(loaded);
          setSavedForm(loaded);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function confirmEdits() {
    setSaving(true);
    try {
      const res = await fetch("/api/company/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          gstNumber: form.gstNumber,
          logoUrl: form.logoUrl,
          stampUrl: form.stampUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated");
        setSavedForm(form);
        setEditing(false);
      } else {
        toast.error(data.error ?? "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  function cancelEdits() {
    setForm(savedForm);
    setEditing(false);
  }

  async function uploadFile(file: File, kind: "logo" | "stamp") {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    if (kind === "logo") setUploadingLogo(true);
    else setUploadingStamp(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload/${kind}`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.data?.url) {
        const field = kind === "logo" ? "logoUrl" : "stampUrl";
        const updated = { ...form, [field]: data.data.url };
        setForm(updated);
        setSavedForm(updated);

        await fetch("/api/company/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updated.name,
            address: updated.address,
            gstNumber: updated.gstNumber,
            logoUrl: updated.logoUrl,
            stampUrl: updated.stampUrl,
          }),
        });

        toast.success(`${kind === "logo" ? "Logo" : "Stamp"} uploaded`);
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } finally {
      if (kind === "logo") setUploadingLogo(false);
      else setUploadingStamp(false);
    }
  }

  async function changePassword() {
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.current || undefined,
          newPassword: pw.next,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated");
        setPw({ current: "", next: "", confirm: "" });
      } else {
        toast.error(data.error ?? "Couldn't update password");
      }
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-black">Profile</h1>
        {editing ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={confirmEdits}
              disabled={saving}
              className="rounded-lg bg-[#0C6B24] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm Edits"}
            </button>
            <button
              type="button"
              onClick={cancelEdits}
              disabled={saving}
              className="rounded-lg border border-black/10 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-black/[0.03] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg bg-[#5E3EA1] px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading…
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/[0.06] pb-5">
              <button
                type="button"
                onClick={() => editing && logoInputRef.current?.click()}
                disabled={!editing || uploadingLogo}
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[0.06] bg-[#F5F5F7]"
              >
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(form.logoUrl) ?? form.logoUrl}
                    alt="Company logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/rono-mark.svg" alt="" className="h-6 w-6" />
                )}
                {editing && (
                  <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#5E3EA1] text-white">
                    <Pencil className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, "logo");
                  e.target.value = "";
                }}
              />
              {editing ? (
                <input
                  value={form.lrCode}
                  disabled
                  className="h-9 w-32 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold uppercase text-black outline-none"
                />
              ) : (
                <span className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-bold uppercase text-black">
                  {form.lrCode || "—"}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <ProfileField
                label="Company Name"
                value={form.name}
                editing={editing}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <ProfileField
                label="GST Number"
                value={form.gstNumber}
                editing={editing}
                onChange={(v) => setForm({ ...form, gstNumber: v.toUpperCase() })}
              />
              <ProfileField
                label="Address"
                value={form.address}
                editing={editing}
                multiline
                onChange={(v) => setForm({ ...form, address: v })}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Account Password */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-black">Account Password</h3>
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  placeholder="Current Password"
                  className="h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
                />
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="New Password"
                  className="h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
                />
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="Confirm Password"
                  className="h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
                />
              </div>
              <button
                type="button"
                onClick={changePassword}
                disabled={pwBusy}
                className="mt-4 h-11 w-full rounded-lg bg-black text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {pwBusy ? "Updating…" : "Change Password"}
              </button>
            </div>

            {/* Authorised Stamp */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-black">Authorized Stamp</h3>
              <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#5E3EA1]/40 bg-[#F9F8FC]">
                {form.stampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(form.stampUrl) ?? form.stampUrl}
                    alt="Company stamp"
                    className="max-h-28 object-contain"
                  />
                ) : (
                  <>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5E3EA1]/10 text-[#5E3EA1]">
                      <ImageUp className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-black">Tap to Upload PNG/JPG</p>
                    <p className="text-[11px] text-[#9CA3AF]">Recommended 200×200 px</p>
                  </>
                )}
              </div>
              <input
                ref={stampInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, "stamp");
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                disabled={uploadingStamp}
                className="mt-4 h-11 w-full rounded-lg border border-black/10 text-sm font-bold text-black transition hover:bg-black/[0.03] disabled:opacity-50"
              >
                {uploadingStamp ? "Uploading…" : form.stampUrl ? "Replace Stamp" : "Upload Stamp"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
  editing,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-black">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-lg bg-[#F5F5F7] px-3.5 py-2.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
          />
        )
      ) : (
        <p className="mt-1.5 rounded-lg bg-[#F5F5F7] px-3.5 py-2.5 text-sm text-black">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
