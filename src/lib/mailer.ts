import nodemailer from "nodemailer";
import { APP_NAME } from "@/constants/config";
import { maskEmail } from "./utils";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

const from = process.env.SMTP_FROM ?? `Denvora <no-reply@denvora.example>`;

export async function sendMail(payload: MailPayload): Promise<void> {
  if (!transporter) {
    // Development fallback: log instead of failing so the flow is testable.
    console.info(
      `[mailer:dev] To=${maskEmail(payload.to)} Subject="${payload.subject}"\n${payload.html.replace(/<[^>]+>/g, " ").trim()}`
    );
    return;
  }

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text ?? payload.html.replace(/<[^>]+>/g, " ").trim(),
    html: payload.html,
  });
}

function wrapTemplate(title: string, body: string, otp?: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #eef2f6;">
                <h1 style="margin:0;font-size:18px;color:#0f766e;">${APP_NAME}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">${title}</h2>
                <div style="font-size:14px;line-height:1.6;color:#374151;">${body}</div>
                ${
                  otp
                    ? `<div style="margin:24px 0;padding:16px;background:#f0fdfa;border:1px dashed #14b8a6;border-radius:8px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:bold;color:#0f766e;">${otp}</div>`
                    : ""
                }
                <p style="margin-top:24px;font-size:12px;color:#6b7280;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}

export function otpEmail(to: string, otp: string, purpose: string): MailPayload {
  return {
    to,
    subject: `Your ${APP_NAME} verification code`,
    html: wrapTemplate(
      `${purpose} verification code`,
      `Use the code below to complete your request. It expires in 10 minutes.`,
      otp
    ),
  };
}

export function passwordResetEmail(to: string, otp: string): MailPayload {
  return {
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: wrapTemplate(
      "Password reset",
      `Use the code below to reset your password. It expires in 10 minutes.`,
      otp
    ),
  };
}

export function welcomeEmail(to: string): MailPayload {
  return {
    to,
    subject: `Welcome to ${APP_NAME}`,
    html: wrapTemplate(
      "Welcome to Denvora",
      `Your account has been created successfully. Verify your email to get started.`
    ),
  };
}

export function inviteEmail(to: string, otp: string, clinicName: string): MailPayload {
  return {
    to,
    subject: `You've been invited to ${clinicName} on ${APP_NAME}`,
    html: wrapTemplate(
      `Invitation to ${clinicName}`,
      `You have been invited to join ${clinicName} on ${APP_NAME}. Use the code below to accept your invitation and set your password. It expires in 24 hours.`,
      otp
    ),
  };
}
