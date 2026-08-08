import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim(),
  );
}

export function getSmtpFromAddress() {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@ronolr.com"
  );
}

export function getSmtpTransport() {
  if (!isSmtpConfigured()) {
    return null;
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!;

  const options: SMTPTransport.Options = {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };

  return nodemailer.createTransport(options);
}
