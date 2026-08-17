import { appendFileSync } from "node:fs";
import { join } from "node:path";

/** Writes a single-line JSON record to dev.log for local-only traceability. */
export function devLog(label: string, payload?: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  const line = JSON.stringify({ t: new Date().toISOString(), label, ...(payload ? (payload as object) : {}) });
  try {
    appendFileSync(join(process.cwd(), "dev.log"), line + "\n");
  } catch {
    /* ignore log fsync failures in dev */
  }
}
