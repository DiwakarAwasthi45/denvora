import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URI || process.env.MONGODB_URI || process.env.MONGODB_URL;
const DATABASE_NAME = process.env.DATABASE_NAME ?? "denvora";

declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

globalThis.__mongoose ??= { conn: null, promise: null };

export async function connectDB(): Promise<typeof mongoose> {
  if (globalThis.__mongoose.conn) {
    return globalThis.__mongoose.conn;
  }

  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel Dashboard → Settings → Environment Variables."
    );
  }

  if (!globalThis.__mongoose.promise) {
    globalThis.__mongoose.promise = mongoose
      .connect(DATABASE_URL, { dbName: DATABASE_NAME })
      .then((m) => m);
  }

  try {
    globalThis.__mongoose.conn = await globalThis.__mongoose.promise;
  } catch (err) {
    globalThis.__mongoose.promise = null;
    throw err;
  }

  return globalThis.__mongoose.conn;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
