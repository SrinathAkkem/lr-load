"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Headphones, Mail, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { SUBJECT_LABELS } from "@/lib/validations/contact-enquiry";
import { ContactSubjectDropdown } from "./contact-subject-dropdown";

export function ContactForm() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subject") ?? "";

  const [fullName, setFullName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState(
    initialSubject && SUBJECT_LABELS[initialSubject] ? initialSubject : "",
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const subjectSelectValue = useMemo(
    () => (subject && SUBJECT_LABELS[subject] ? subject : ""),
    [subject],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectSelectValue) {
      toast.error("Please choose a subject");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          customerId: customerId || undefined,
          email,
          mobile,
          subject: subjectSelectValue,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to send enquiry");
      }
      toast.success("Enquiry sent successfully. We'll get back to you soon.");
      setFullName("");
      setCustomerId("");
      setEmail("");
      setMobile("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-black/10 bg-[#F5F5F7] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-black sm:text-2xl">
        We&apos;d Love To Hear From You! Let&apos;s Get in Touch
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-[#6B7280]">Full Name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Full Name"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5E3EA1]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#6B7280]">Customer_ID</span>
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Your Customer_ID"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5E3EA1]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#6B7280]">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5E3EA1]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#6B7280]">Mobile No</span>
          <input
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Your Mobile No"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5E3EA1]"
          />
        </label>
      </div>

      <div className="mt-4 block">
        <span className="text-xs font-semibold text-[#6B7280]">Subject</span>
        <ContactSubjectDropdown value={subjectSelectValue} onChange={setSubject} />
      </div>

      <label className="relative mt-4 block">
        <span className="text-xs font-semibold text-[#6B7280]">Message</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write Message Here"
          className="mt-1.5 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#5E3EA1]"
        />
        <Paperclip className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-[#9CA3AF]" />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-[#3C60B6] to-[#5E3EA1] px-8 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}

export function ContactSupportCard() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-black">Technical Support</h3>
      <div className="mt-5 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2EFFA] text-[#5E3EA1]">
          <Headphones className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-black">Call: 6 A.M. to 10 P.M. IST</p>
          <a href="tel:+911234523454" className="text-sm text-[#4D4D4D] hover:text-black">
            +91 12345 23454
          </a>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2EFFA] text-[#5E3EA1]">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-black">Email: 24*7</p>
          <a href="mailto:contact@ronolabs.com" className="text-sm text-[#4D4D4D] hover:text-black">
            contact@ronolabs.com
          </a>
        </div>
      </div>
      <a
        href="/contact?subject=support"
        className="mt-6 inline-flex rounded-full border border-black/15 px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#F5F5F7]"
      >
        Feature Request
      </a>
    </div>
  );
}
