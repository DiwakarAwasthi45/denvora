import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/api";
import { hashToken, createOtpCode, secureCompare } from "@/lib/otp";
import { VerificationTokenModel } from "@/models/VerificationToken";
import { ClinicModel } from "@/models/Clinic";
import { PatientModel } from "@/models/Patient";
import { sendMail, otpEmail } from "@/lib/mailer";
import { OTP } from "@/constants/config";
import { createPatientToken } from "@/lib/patient-session";

/**
 * Request a login OTP for a patient by phone + clinic slug.
 * Returns `sent: false` when no matching patient exists (avoids enumeration).
 */
export async function requestPatientOtp(
  phone: string,
  clinicSlug: string
): Promise<{ sent: boolean; code?: string }> {
  await connectDB();
  const clinic = await ClinicModel.findOne({ slug: clinicSlug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");

  const patient = await PatientModel.findOne({ clinicId: clinic._id, phone }).lean();
  if (!patient) return { sent: false };

  const otp = createOtpCode();
  await VerificationTokenModel.create({
    tokenHash: hashToken(otp),
    type: "patient_login",
    patientId: patient._id,
    expiresAt: new Date(Date.now() + OTP.ttlMinutes * 60 * 1000),
    metadata: { clinicId: String(clinic._id), phone },
  });

  if (patient.email) {
    await sendMail(otpEmail(patient.email, otp, "Patient login")).catch(() => {});
  }
  // In dev, surface the OTP so the flow is testable without real SMS/email.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] Patient login OTP for ${phone}: ${otp}`);
  }
  return { sent: true, code: process.env.NODE_ENV !== "production" ? otp : undefined };
}

/**
 * Verify a patient login OTP. On success returns a signed session token.
 */
export async function verifyPatientOtp(
  phone: string,
  clinicSlug: string,
  otp: string
): Promise<{ token: string }> {
  await connectDB();
  const clinic = await ClinicModel.findOne({ slug: clinicSlug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");

  const patient = await PatientModel.findOne({ clinicId: clinic._id, phone }).lean();
  if (!patient) throw new ApiError("Invalid code", { statusCode: 400, code: ERROR_CODES.OTP_INVALID });

  const tokenDoc = await VerificationTokenModel.findOne({
    patientId: patient._id,
    type: "patient_login",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!tokenDoc) throw new ApiError("Invalid or expired code", { statusCode: 400, code: ERROR_CODES.OTP_EXPIRED });
  if ((tokenDoc.attempts ?? 0) >= OTP.maxAttempts) {
    throw new ApiError("Too many attempts. Request a new code.", { statusCode: 400, code: ERROR_CODES.OTP_MAX_ATTEMPTS });
  }
  if (!secureCompare(hashToken(otp), tokenDoc.tokenHash)) {
    await VerificationTokenModel.updateOne({ _id: tokenDoc._id }, { $inc: { attempts: 1 } }).exec();
    throw new ApiError("Invalid code", { statusCode: 400, code: ERROR_CODES.OTP_INVALID });
  }

  await VerificationTokenModel.updateOne({ _id: tokenDoc._id }, { $set: { consumedAt: new Date() } }).exec();

  const token = createPatientToken({
    pid: String(patient._id),
    cid: String(clinic._id),
    ph: phone,
  });
  return { token };
}
