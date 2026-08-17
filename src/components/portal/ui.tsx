import type { ReactNode } from "react";

export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
export const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const money = (n: number, c = "NPR") => `${c} ${Number(n ?? 0).toLocaleString()}`;

const STATUS_TONE: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-700",
  confirmed: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  no_show: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
  open: "bg-amber-100 text-amber-700",
  partial: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
  void: "bg-slate-100 text-slate-600",
  proposed: "bg-indigo-100 text-indigo-700",
  planned: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  declined: "bg-rose-100 text-rose-700",
  on_hold: "bg-slate-100 text-slate-600",
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-400">{text}</p>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>{children}</div>;
}
