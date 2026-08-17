import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clinicId: string | null;
      branchId: string | null;
      role: string | null;
      roleId: string | null;
      permissions: string[];
      isPlatform: boolean;
      isEmailVerified: boolean;
      tokenVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    clinicId?: string | null;
    branchId?: string | null;
    role?: string | null;
    roleId?: string | null;
    permissions?: string[];
    isPlatform?: boolean;
    isEmailVerified?: boolean;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    clinicId?: string | null;
    branchId?: string | null;
    role?: string | null;
    roleId?: string | null;
    permissions?: string[];
    isPlatform?: boolean;
    isEmailVerified?: boolean;
    tokenVersion: number;
  }
}
