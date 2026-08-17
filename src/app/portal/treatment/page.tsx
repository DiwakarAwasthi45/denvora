"use client";

import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section, StatusPill, Empty, money, fmtDate } from "@/components/portal/ui";

const PRIORITY_TONE: Record<string, string> = {
  urgent: "text-rose-600", high: "text-amber-600", medium: "text-slate-600", low: "text-slate-400",
};

export default function PortalTreatment() {
  const { data } = usePatient();
  const active = data.treatments.filter((t) => ["proposed", "planned", "in_progress", "on_hold"].includes(t.status));
  const done = data.treatments.filter((t) => ["completed", "declined"].includes(t.status));

  return (
    <div className="space-y-5">
      <Section title="Active treatment plan">
        {active.length === 0 ? <Empty text="No active treatment plans." /> : (
          <div className="space-y-2">
            {active.map((t) => (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{t.procedure}</p>
                    <p className="text-sm text-slate-500">{t.diagnosis}</p>
                  </div>
                  <StatusPill status={t.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={`text-xs font-semibold uppercase ${PRIORITY_TONE[t.priority] ?? "text-slate-500"}`}>{t.priority} priority</span>
                  <span className="font-semibold text-slate-900">{money(t.cost)}</span>
                </div>
                {t.notes && <p className="mt-2 text-xs text-slate-400">{t.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Completed / Declined">
        {done.length === 0 ? <Empty text="Nothing here yet." /> : (
          <div className="space-y-2">
            {done.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{t.procedure}</p>
                    <p className="text-xs text-slate-400">{fmtDate(t.createdAt)}</p>
                  </div>
                  <StatusPill status={t.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
