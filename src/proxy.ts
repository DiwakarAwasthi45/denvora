import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ONLY = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/accept-invite"];
const PROTECTED_PAGES = ["/dashboard", "/admin", "/onboarding"];
const PUBLIC_AUTH_API = "/api/auth";
const PUBLIC_API = ["/api/health", "/api/public", "/api/patient-portal", "/api/patient/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret }) : null;

  const isPublicOnlyPage = PUBLIC_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthApi = pathname === PUBLIC_AUTH_API || pathname.startsWith(`${PUBLIC_AUTH_API}/`);
  const isPublicApi = PUBLIC_API.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Authenticated users are sent away from auth-only pages.
  if (token && isPublicOnlyPage) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  // Unauthenticated users are sent to login for protected pages.
  if (!token && isProtectedPage) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Optimistic guard for the non-auth API surface.
  if (!token && pathname.startsWith("/api/") && !isAuthApi && !isPublicApi) {
    return NextResponse.json(
      { success: false, message: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected pages
    "/dashboard/:path*",
    "/admin/:path*",
    "/onboarding",
    // Auth-only pages
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/accept-invite",
    // API routes
    "/api/:path*",
  ],
};
