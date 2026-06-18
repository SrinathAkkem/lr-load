"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, LogOut, Building2 } from "lucide-react";

interface FormState {
  name: string;
  address: string;
  gstNumber: string;
  logoUrl: string;
  stampUrl: string;
  lrCode: string;
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
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const c = d.data;
          setForm({
            name: c.name ?? "",
            address: c.address ?? "",
            gstNumber: c.gstNumber ?? "",
            logoUrl: c.logoUrl ?? "",
            stampUrl: c.stampUrl ?? "",
            lrCode: c.lrCode ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
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
      if (data.success) toast.success("Profile saved");
      else toast.error(data.error ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(
    file: File,
    kind: "logo" | "stamp",
  ) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    if (kind === "logo") setUploadingLogo(true);
    else setUploadingStamp(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload/${kind}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setForm((prev) => ({
          ...prev,
          [kind === "logo" ? "logoUrl" : "stampUrl"]: data.data.url,
        }));
        toast.success(`${kind === "logo" ? "Logo" : "Stamp"} uploaded`);
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } finally {
      if (kind === "logo") setUploadingLogo(false);
      else setUploadingStamp(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/company/login");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <p className="text-slate-500">
            These details appear on every LR PDF and the public QR landing.
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="text-red-600">
          <LogOut className="mr-1.5 h-4 w-4" />
          Logout
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading…
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <Label>Company Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>LR Code</Label>
              <Input value={form.lrCode} disabled className="mt-1.5 bg-slate-50" />
              <p className="mt-1 text-[11px] text-slate-400">
                Code is locked once issued — used in every LR number.
              </p>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input
                value={form.gstNumber}
                onChange={(e) =>
                  setForm({ ...form, gstNumber: e.target.value.toUpperCase() })
                }
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-semibold">Company Logo</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Used on LR PDFs (top-left). PNG / JPEG, transparent preferred.
              </p>
              <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Company logo"
                    className="max-h-28 object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No logo uploaded</span>
                )}
              </div>
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
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {uploadingLogo
                  ? "Uploading…"
                  : form.logoUrl
                    ? "Replace Logo"
                    : "Upload Logo"}
              </Button>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold">Authorised Stamp</h3>
              <p className="mt-1 text-xs text-slate-500">
                Printed near signature on every approved LR PDF.
              </p>
              <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                {form.stampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.stampUrl}
                    alt="Company stamp"
                    className="max-h-28 object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No stamp uploaded</span>
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
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => stampInputRef.current?.click()}
                disabled={uploadingStamp}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {uploadingStamp
                  ? "Uploading…"
                  : form.stampUrl
                    ? "Replace Stamp"
                    : "Upload Stamp"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
