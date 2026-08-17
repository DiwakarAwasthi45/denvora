"use client";

import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section, StatusPill, Empty, money, fmtDate, fmtDateTime } from "@/components/portal/ui";
import Link from "next/link";

export default function PortalHome() {
  const { data } = usePatient();
  const upcoming = data.appointments.filter((a) => ["scheduled", "confirmed"].includes(a.status));
  const next = upcoming[0];
  const balance = data.invoices.filter((i) => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + (i.total ?? 0), 0);

  return (
    <div className="space-y-5">
      {next && (
        <Card className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">Next appointment</p>
          <p className="mt-1 text-xl font-semibold">{fmtDate(next.date)} · {next.startTime}–{next.endTime}</p>
          <p className="text-sm opacity-90">{next.dentistName ? `Dr. ${next.dentistName}` : "Your dentist"} · {next.reason || next.type}</p>
          <Link href="/portal/appointments" className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30">View details</Link>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Upcoming" value={String(upcoming.length)} />
        <Stat label="Visits" value={String(data.appointments.length)} />
        <Stat label="Balance" value={money(balance)} />
      </div>

      <Section title="Upcoming appointments">
        {upcoming.length === 0 ? <Empty text="No upcoming appointments. Book one from the top." /> : (
          <div className="space-y-2">
            {upcoming.slice(0, 3).map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{fmtDate(a.date)} · {a.startTime}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{a.dentistName ? `Dr. ${a.dentistName}` : "Dentist"} · {a.reason || a.type}</p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent invoices">
        {data.invoices.length === 0 ? <Empty text="No invoices yet." /> : (
          <div className="space-y-2">
            {data.invoices.slice(0, 3).map((i) => (
              <Card key={i.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{i.number}</p>
                  <StatusPill status={i.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{money(i.total, i.currency)} · {fmtDateTime(i.issuedAt)}</p>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-indigo-50 p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
