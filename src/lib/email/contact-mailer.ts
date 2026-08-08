import nodemailer from "nodemailer";

export type ContactEmailPayload = {
  fullName: string;
  customerId?: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
};

const DEFAULT_NOTIFY_EMAIL = "rayudugroup01@gmail.com";

function isEmailEnabled() {
  return process.env.CONTACT_EMAIL_ENABLED === "true";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTransport() {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function buildPlainText(payload: ContactEmailPayload) {
  return [
    "New contact enquiry — Rono",
    "",
    `Name: ${payload.fullName}`,
    payload.customerId ? `Customer ID: ${payload.customerId}` : null,
    `Email: ${payload.email}`,
    `Mobile: ${payload.mobile}`,
    `Subject: ${payload.subject}`,
    "",
    "Message:",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildHtml(payload: ContactEmailPayload) {
  const rows = [
    { label: "Name", value: payload.fullName },
    payload.customerId ? { label: "Customer ID", value: payload.customerId } : null,
    { label: "Email", value: payload.email },
    { label: "Mobile", value: payload.mobile },
    { label: "Subject", value: payload.subject },
  ].filter(Boolean) as { label: string; value: string }[];

  const detailRows = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #ececec;color:#6b7280;font-size:13px;width:120px;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #ececec;color:#111827;font-size:14px;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(90deg,#3C60B6,#5E3EA1);color:#ffffff;">
                <div style="font-size:20px;font-weight:700;">New Contact Enquiry</div>
                <div style="margin-top:6px;font-size:14px;opacity:0.9;">Rono marketing site</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  ${detailRows}
                </table>
                <div style="margin-top:20px;font-size:13px;font-weight:700;color:#111827;">Message</div>
                <div style="margin-top:8px;padding:14px 16px;background:#f9fafb;border:1px solid #ececec;border-radius:12px;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
                <div style="margin-top:20px;font-size:12px;color:#9ca3af;">Reply directly to this email to reach the customer.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendContactEnquiryEmail(payload: ContactEmailPayload) {
  if (!isEmailEnabled()) {
    console.info("[contact] email disabled — enquiry stored only:", payload.email, payload.subject);
    return { sent: false, reason: "disabled" as const };
  }

  const transport = getTransport();
  const to = process.env.CONTACT_NOTIFY_EMAIL ?? DEFAULT_NOTIFY_EMAIL;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  if (!transport || !from) {
    console.warn("[contact] SMTP not configured — enquiry stored only");
    return { sent: false, reason: "not_configured" as const };
  }

  const subject = `[Rono Contact] ${payload.subject}`;

  await transport.sendMail({
    from,
    to,
    replyTo: payload.email,
    subject,
    text: buildPlainText(payload),
    html: buildHtml(payload),
  });

  return { sent: true as const };
}
