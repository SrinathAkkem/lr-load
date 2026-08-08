import { getSmtpFromAddress, getSmtpTransport } from "./smtp";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmailOtpMail(email: string, code: string) {
  const transport = getSmtpTransport();
  const from = getSmtpFromAddress();

  if (!transport) {
    throw new Error("SMTP is not configured");
  }

  const subject = `${code} is your RonoLR verification code`;
  const text = [
    "Your RonoLR email verification code is:",
    "",
    code,
    "",
    "This code is valid for 2 minutes. Do not share it with anyone.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(90deg,#3C60B6,#5E3EA1);color:#ffffff;">
                <div style="font-size:20px;font-weight:700;">RonoLR verification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;text-align:center;">
                <div style="font-size:14px;color:#6b7280;">Your verification code</div>
                <div style="margin-top:12px;font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;">${escapeHtml(code)}</div>
                <div style="margin-top:16px;font-size:13px;color:#9ca3af;line-height:1.6;">
                  Valid for 2 minutes. Sent to ${escapeHtml(email)}.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await transport.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });
}
