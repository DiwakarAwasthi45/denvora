import { sendMail, otpEmail, passwordResetEmail, welcomeEmail, inviteEmail } from "@/lib/mailer";
import { devLog } from "@/lib/dev-log";
import type { TenantContext } from "@/types";
import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/models/Notification";
import { MASK_SMS } from "@/lib/utils";
import { Types } from "mongoose";

export type Channel = "email" | "sms" | "whatsapp";
export type Template =
  | "otp"
  | "password_reset"
  | "welcome"
  | "invite"
  | "appointment_reminder"
  | "payment_receipt";

export interface NotificationInput {
  to: string;
  channel: Channel;
  template: Template;
  purpose?: string;
  otp?: string;
  clinicName?: string;
  subject?: string;
  body?: string;
}

/**
 * Notification dispatcher.
 * - email: real (nodemailer) when SMTP configured, else dev-log fallback.
 * - sms/whatsapp: stubbed to dev.log (Twilio credentials not yet configured).
 */
export class NotificationService {
  static async send(context: TenantContext, input: NotificationInput): Promise<void> {
    if (!context.clinicId) throw new Error("No clinic context");
    await connectDB();

    const record = await NotificationModel.create({
      clinicId: new Types.ObjectId(context.clinicId),
      channel: input.channel,
      template: input.template,
      recipient: MASK_SMS(input.to),
      subject: input.subject ?? this.defaultSubject(input.template),
      status: "queued",
    });

    try {
      switch (input.channel) {
        case "email":
          await sendMail(this.buildEmail(input, context));
          break;
        case "sms":
          await this.stubSms(input);
          break;
        case "whatsapp":
          await this.stubWhatsApp(input);
          break;
      }

      await NotificationModel.updateOne(
        { _id: record._id },
        { $set: { status: "sent", sentAt: new Date() } }
      ).exec();
    } catch (err) {
      devLog("[notification] send failed", { channel: input.channel, error: err instanceof Error ? err.message : String(err) });
      await NotificationModel.updateOne(
        { _id: record._id },
        { $set: { status: "failed", error: err instanceof Error ? err.message : "unknown" } }
      ).exec();
      throw err;
    }
  }

  private static defaultSubject(template: Template): string {
    switch (template) {
      case "appointment_reminder":
        return "Appointment reminder";
      case "payment_receipt":
        return "Payment receipt";
      default:
        return "Denvora notification";
    }
  }

  private static buildEmail(input: NotificationInput, context: TenantContext): Parameters<typeof sendMail>[0] {
    switch (input.template) {
      case "otp":
        return otpEmail(input.to, input.otp ?? "", input.purpose ?? "verification");
      case "password_reset":
        return passwordResetEmail(input.to, input.otp ?? "");
      case "welcome":
        return welcomeEmail(input.to);
      case "invite":
        return inviteEmail(input.to, input.otp ?? "", input.clinicName ?? "your clinic");
      default:
        return {
          to: input.to,
          subject: input.subject ?? this.defaultSubject(input.template),
          html: `<p>${input.body ?? ""}</p>`,
          text: input.body ?? "",
        };
    }
  }

  private static async stubSms(input: NotificationInput): Promise<void> {
    devLog("[notification/sms:stub]", { to: MASK_SMS(input.to), template: input.template, body: input.body });
  }

  private static async stubWhatsApp(input: NotificationInput): Promise<void> {
    devLog("[notification/whatsapp:stub]", { to: MASK_SMS(input.to), template: input.template, body: input.body });
  }
}
