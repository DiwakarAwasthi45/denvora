import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { connectDB } from "./db";
import { UserModel } from "@/models/User";
import { ClinicModel } from "@/models/Clinic";
import { normalizeEmail } from "./utils";
import { RATE_LIMIT, SESSION } from "@/constants/config";
import { assertRateLimit } from "./rate-limit";
import { recordFailedLogin, recordSuccessfulLogin } from "@/services/auth.service";

class InvalidCredentialsError extends CredentialsSignin {}

/** Valid hash of a dummy phrase; compared against when the email is unknown to hide user enumeration timing. */
const DUMMY_PASSWORD_HASH = "$2b$12$g76ZorCUt/DP5LzESTF.f.tTxvW7cl8CCbcrI1R9vPT12TKSJEcUu";

const maxAgeSeconds = SESSION.maxAgeDays * 24 * 60 * 60;

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: maxAgeSeconds,
    // No sliding refresh: updateAge >= maxAge means the token never re-issues,
    // so sessions hard-expire after SESSION.maxAgeDays.
    updateAge: maxAgeSeconds,
  },
  trustHost: true,
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      // Explicitly harden the session cookie. Leaving `name` unset lets
      // NextAuth apply the __Secure- prefix automatically over HTTPS.
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(String(credentials?.email ?? ""));
        const password = String(credentials?.password ?? "");

        if (!email || !password) throw new InvalidCredentialsError();

        await connectDB();

        const user = await UserModel.findOne({ email }).lean();
        if (!user) {
          // Burn comparable work so unknown emails cannot be distinguished by latency.
          await bcrypt.compare("denvora-timing-anchor", DUMMY_PASSWORD_HASH);
          throw new InvalidCredentialsError();
        }

        const userId = user._id.toString();

        assertRateLimit({
          key: `login:${userId}`,
          limit: RATE_LIMIT.authMax,
          windowMs: RATE_LIMIT.authWindowMs,
        });

        if (user.lockUntil && user.lockUntil > new Date()) {
          throw new InvalidCredentialsError();
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordFailedLogin(userId);
          throw new InvalidCredentialsError();
        }

        if (user.status !== "active" || !user.emailVerified) throw new InvalidCredentialsError();

        if (user.clinicId) {
          const clinic = await ClinicModel.findById(user.clinicId).select("status").lean();
          if (!clinic || clinic.status === "suspended") throw new InvalidCredentialsError();
        }

        await recordSuccessfulLogin(userId);

        return {
          id: userId,
          name: user.name,
          email: user.email,
          clinicId: user.clinicId ? user.clinicId.toString() : null,
          branchId: user.branchId ? user.branchId.toString() : null,
          role: user.role,
          roleId: user.roleId ? user.roleId.toString() : null,
          permissions: user.permissions,
          isPlatform: user.isPlatform,
          isEmailVerified: user.emailVerified,
          tokenVersion: user.tokenVersion ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user) {
        token.id = user.id ?? "";
        token.clinicId = user.clinicId ?? null;
        token.branchId = user.branchId ?? null;
        token.role = user.role ?? null;
        token.roleId = user.roleId ?? null;
        token.permissions = user.permissions ?? [];
        token.isPlatform = user.isPlatform ?? false;
        token.isEmailVerified = user.isEmailVerified ?? false;
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.clinicId = token.clinicId ?? null;
        session.user.branchId = token.branchId ?? null;
        session.user.role = token.role ?? null;
        session.user.roleId = token.roleId ?? null;
        session.user.permissions = token.permissions ?? [];
        session.user.isPlatform = token.isPlatform ?? false;
        session.user.isEmailVerified = token.isEmailVerified ?? false;
        session.user.tokenVersion = token.tokenVersion ?? 0;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type { Session } from "next-auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
