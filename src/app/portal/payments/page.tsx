"use client";

import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section, StatusPill, Empty, money, fmtDate } from "@/components/portal/ui";

export default function PortalPayments() {
  const { data } = usePatient();
  const outstanding = data.invoices.filter((i) => i.status !== "paid" && i.status !== "void");
  const totalDue = outstanding.reduce((s, i) => s + (i.total ?? 0), 0);

  return (
    <div className="space-y-5">
      <Card className="bg-indigo-50">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">Outstanding balance</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{money(totalDue)}</p>
        <p className="text-sm text-slate-500">{outstanding.length} invoice(s) unpaid</p>
      </Card>

      <Section title="All invoices">
        {data.invoices.length === 0 ? <Empty text="No invoices yet." /> : (
          <div className="space-y-2">
            {data.invoices.map((i) => (
              <Card key={i.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{i.number}</p>
                    <p className="text-xs text-slate-400">{fmtDate(i.issuedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{money(i.total, i.currency)}</p>
                    <StatusPill status={i.status} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
