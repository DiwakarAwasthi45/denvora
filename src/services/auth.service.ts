import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/api";
import { hashToken, createOtpCode, secureCompare } from "@/lib/otp";
import { otpEmail, passwordResetEmail, welcomeEmail, sendMail } from "@/lib/mailer";
import { LOGIN, OTP } from "@/constants/config";
import { UserModel } from "@/models/User";
import { VerificationTokenModel } from "@/models/VerificationToken";
import { createClinic } from "./clinic.service";
import { ensureSeeded, getRoleBySlug } from "./permission.service";
import { SYSTEM_ROLE_SLUGS } from "@/constants/roles";
import { maskEmail, normalizeEmail } from "@/lib/utils";
import type { LoginInput, RegisterInput, ResetPasswordInput, ResendOtpInput, AcceptInviteInput } from "@/validations/auth.schema";
import type { SafeUser } from "@/types";

const BCRYPT_ROUNDS = 12;
export const INVITE_TTL_MINUTES = 24 * 60; // staff invites last 24 hours

/** Valid hash of a dummy phrase; compared against when the email is unknown to hide user enumeration timing. */
const DUMMY_PASSWORD_HASH = "$2b$12$g76ZorCUt/DP5LzESTF.f.tTxvW7cl8CCbcrI1R9vPT12TKSJEcUu";

/**
 * Register a failed password attempt. Locks the account once attempts reach
 * LOGIN.maxAttempts. Returns true when the account just became locked.
 */
export async function recordFailedLogin(userId: string): Promise<boolean> {
  const user = await UserModel.findById(userId).select("loginAttempts lockUntil").lean();
  if (!user) return false;

  const attempts = (user.loginAttempts ?? 0) + 1;
  if (attempts >= LOGIN.maxAttempts) {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { loginAttempts: attempts, lockUntil: new Date(Date.now() + LOGIN.lockMs) } }
    ).exec();
    return true;
  }

  await UserModel.updateOne({ _id: userId }, { $set: { loginAttempts: attempts } }).exec();
  return false;
}

/** Clear lockout state and record the successful sign-in. */
export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { loginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } }
  ).exec();
}

function toSafeUser(user: { _id: unknown; name: string; email: string; phone?: string; avatar?: string; role?: string | null; clinicId?: unknown; emailVerified: boolean }): SafeUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role ?? null,
    clinicId: user.clinicId ? String(user.clinicId) : null,
    emailVerified: user.emailVerified,
  };
}

export async function createOtpRecord(
  userId: string,
  type: "email_verification" | "password_reset" | "staff_invite",
  ttlMinutes?: number
): Promise<string> {
  const otp = createOtpCode();
  await VerificationTokenModel.create({
    tokenHash: hashToken(otp),
    type,
    userId: new Types.ObjectId(userId),
    expiresAt: new Date(Date.now() + (ttlMinutes ?? OTP.ttlMinutes) * 60 * 1000),
  });
  return otp;
}

export async function registerUser(input: RegisterInput): Promise<{ user: SafeUser; maskedEmail: string }> {
  try {
    await connectDB();
    await ensureSeeded();

    const email = normalizeEmail(input.email);

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      if (existing.status === "pending" || !existing.emailVerified) {
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        await UserModel.updateOne(
          { _id: existing._id },
          { $set: { status: "active", emailVerified: true, emailVerifiedAt: new Date(), passwordHash } }
        ).exec();
        const updated = await UserModel.findById(existing._id).lean();
        return { user: toSafeUser(updated ?? existing), maskedEmail: maskEmail(email) };
      }
      throw new ApiError("An account with this email already exists", {
        statusCode: 409,
        code: ERROR_CODES.USER_EXISTS,
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await UserModel.create({
      name: input.name,
      email,
      phone: input.phone ?? "",
      passwordHash,
      isPlatform: false,
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const { clinicId, slug } = await createClinic({
      name: input.clinicName,
      email,
      phone: input.phone,
      ownerId: user._id.toString(),
    });

    const ownerRole = await getRoleBySlug(clinicId.toString(), SYSTEM_ROLE_SLUGS.CLINIC_OWNER);
    if (!ownerRole) {
      throw new ApiError("Clinic owner role is not configured", {
        statusCode: 500,
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          clinicId,
          roleId: ownerRole._id,
          role: ownerRole.slug,
          permissions: ownerRole.permissions,
        },
      }
    ).exec();

    const updatedUser = await UserModel.findById(user._id).lean();
    return { user: toSafeUser(updatedUser ?? user), maskedEmail: maskEmail(email) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Registration failed");
  }
}

export async function resendOtp(input: ResendOtpInput): Promise<{ maskedEmail: string }> {
  try {
    await connectDB();

    const email = normalizeEmail(input.email);
    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      return { maskedEmail: maskEmail(email) };
    }

    const type = input.purpose === "password_reset" ? "password_reset" : "email_verification";

    const lastToken = await VerificationTokenModel.findOne({
      userId: user._id,
      type,
    }).sort({ createdAt: -1 }).lean();

    if (lastToken && lastToken.expiresAt > new Date()) {
      const cooldownMs = OTP.cooldownSeconds * 1000;
      const elapsed = Date.now() - new Date(lastToken.createdAt).getTime();
      if (elapsed < cooldownMs) {
        throw new ApiError(`Please wait before requesting another code.`, {
          statusCode: 429,
          code: ERROR_CODES.OTP_COOLDOWN,
        });
      }
    }

    const otp = await createOtpRecord(user._id.toString(), type);
    const mail = type === "password_reset" ? passwordResetEmail(email, otp) : otpEmail(email, otp, "Email");

    await sendMail(mail);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Resent ${type} OTP for ${email}: ${otp}`);
    }

    return { maskedEmail: maskEmail(email) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Failed to resend code");
  }
}

export async function forgotPassword(emailAddress: string): Promise<{ maskedEmail: string }> {
  try {
    await connectDB();

    const email = normalizeEmail(emailAddress);
    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      return { maskedEmail: maskEmail(email) };
    }

    const otp = await createOtpRecord(user._id.toString(), "password_reset");
    await sendMail(passwordResetEmail(email, otp));
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Password reset OTP for ${email}: ${otp}`);
    }

    return { maskedEmail: maskEmail(email) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Failed to process password reset");
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  try {
    await connectDB();

    const email = normalizeEmail(input.email);
    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      throw new ApiError("Account not found", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
    }

    const token = await VerificationTokenModel.findOne({
      userId: user._id,
      type: "password_reset",
      consumedAt: null,
    }).sort({ createdAt: -1 }).lean();

    if (!token) {
      throw new ApiError("No reset code found. Please request a new one.", {
        statusCode: 400,
        code: ERROR_CODES.OTP_INVALID,
      });
    }

    if (token.expiresAt < new Date()) {
      throw new ApiError("This reset code has expired. Please request a new one.", {
        statusCode: 400,
        code: ERROR_CODES.OTP_EXPIRED,
      });
    }

    if (token.attempts >= OTP.maxAttempts) {
      throw new ApiError("Too many failed attempts. Please request a new code.", {
        statusCode: 400,
        code: ERROR_CODES.OTP_MAX_ATTEMPTS,
      });
    }

    if (!secureCompare(hashToken(input.otp), token.tokenHash)) {
      await VerificationTokenModel.updateOne({ _id: token._id }, { $inc: { attempts: 1 } }).exec();
      throw new ApiError("Invalid reset code", {
        statusCode: 400,
        code: ERROR_CODES.OTP_INVALID,
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
          loginAttempts: 0,
          lockUntil: null,
        },
        $inc: { tokenVersion: 1 },
      }
    ).exec();

    await VerificationTokenModel.updateOne(
      { _id: token._id },
      { $set: { consumedAt: new Date() } }
    ).exec();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Failed to reset password");
  }
}

export async function verifyCredentials(input: LoginInput): Promise<SafeUser> {
  try {
    await connectDB();

    const email = normalizeEmail(input.email);
    const user = await UserModel.findOne({ email }).lean();

    if (!user) {
      await bcrypt.compare("denvora-timing-anchor", DUMMY_PASSWORD_HASH);
      throw new ApiError("Invalid email or password", {
        statusCode: 401,
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    }

    if (user.status !== "active" || !user.emailVerified) {
      throw new ApiError("Verify your email before signing in.", {
        statusCode: 403,
        code: ERROR_CODES.EMAIL_NOT_VERIFIED,
      });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ApiError("Account temporarily locked. Try again later.", {
        statusCode: 429,
        code: ERROR_CODES.ACCOUNT_LOCKED,
      });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      await recordFailedLogin(user._id.toString());
      throw new ApiError("Invalid email or password", {
        statusCode: 401,
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    }

    await recordSuccessfulLogin(user._id.toString());

    return toSafeUser(user);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Login failed");
  }
}

export async function acceptInvite(input: AcceptInviteInput): Promise<{ user: SafeUser }> {
  try {
    await connectDB();

    const email = normalizeEmail(input.email);
    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      throw new ApiError("Invitation not found", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
    }

    if (user.status !== "invited") {
      throw new ApiError("This invitation is no longer valid", {
        statusCode: 400,
        code: ERROR_CODES.TOKEN_INVALID,
      });
    }

    const token = await VerificationTokenModel.findOne({
      userId: user._id,
      type: "staff_invite",
      consumedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!token) {
      throw new ApiError("No invitation found. Ask your clinic to resend the invitation.", {
        statusCode: 400,
        code: ERROR_CODES.TOKEN_INVALID,
      });
    }

    if (token.expiresAt < new Date()) {
      throw new ApiError("This invitation has expired. Ask your clinic to resend it.", {
        statusCode: 400,
        code: ERROR_CODES.TOKEN_EXPIRED,
      });
    }

    if (token.attempts >= OTP.maxAttempts) {
      throw new ApiError("Too many failed attempts. Ask your clinic to resend the invitation.", {
        statusCode: 400,
        code: ERROR_CODES.OTP_MAX_ATTEMPTS,
      });
    }

    if (!secureCompare(hashToken(input.otp), token.tokenHash)) {
      await VerificationTokenModel.updateOne({ _id: token._id }, { $inc: { attempts: 1 } }).exec();
      throw new ApiError("Invalid invitation code", {
        statusCode: 400,
        code: ERROR_CODES.OTP_INVALID,
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: "active",
          loginAttempts: 0,
          lockUntil: null,
        },
      }
    ).exec();

    await VerificationTokenModel.updateOne(
      { _id: token._id },
      { $set: { consumedAt: new Date() } }
    ).exec();

    await sendMail(welcomeEmail(email));

    return { user: toSafeUser({ ...user, emailVerified: true }) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(error instanceof Error ? error.message : "Failed to accept invitation");
  }
}

export { toSafeUser };
