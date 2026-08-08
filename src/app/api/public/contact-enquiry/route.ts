import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { sendContactEnquiryEmail } from "@/lib/email/contact-mailer";
import { contactEnquirySchema, subjectLabel } from "@/lib/validations/contact-enquiry";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = contactEnquirySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid form data", 400);
  }

  const data = parsed.data;
  const subjectText = subjectLabel(data.subject);

  const enquiry = await prisma.contactEnquiry.create({
    data: {
      fullName: data.fullName.trim(),
      customerId: data.customerId?.trim() || null,
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile.trim(),
      subject: subjectText,
      message: data.message.trim(),
    },
  });

  const mailResult = await sendContactEnquiryEmail({
    fullName: enquiry.fullName,
    customerId: enquiry.customerId ?? undefined,
    email: enquiry.email,
    mobile: enquiry.mobile,
    subject: enquiry.subject,
    message: enquiry.message,
  });

  return jsonOk({
    id: enquiry.id,
    message: "Your enquiry has been submitted successfully.",
    emailSent: mailResult.sent === true,
  });
}
