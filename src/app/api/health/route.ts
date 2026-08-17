import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URI: !!process.env.DATABASE_URI,
    MONGODB_URI: !!process.env.MONGODB_URI,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AI_API_KEY: !!process.env.AI_API_KEY,
    SMTP_HOST: !!process.env.SMTP_HOST,
  };

  let dbStatus = "not checked";
  try {
    const { connectDB } = await import("@/lib/db");
    await connectDB();
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = `failed: ${e.message}`;
  }

  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      env: envCheck,
      db: dbStatus,
    },
  });
}
