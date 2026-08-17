"use client";

import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section } from "@/components/portal/ui";

export default function PortalProfile() {
  const { data } = usePatient();
  const p = data.patient;
  const initials = (p.name?.charAt(0) ?? "?").toUpperCase();

  const rows: Array<[string, string]> = [
    ["Full name", p.name || "—"],
    ["Phone", p.phone || "—"],
    ["Email", p.email || "—"],
    ["Date of birth", p.dob ? new Date(p.dob).toLocaleDateString() : "—"],
    ["Gender", p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—"],
  ];

  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-semibold text-indigo-700">{initials}</div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{p.name}</p>
          <p className="text-sm text-slate-500">{p.phone}</p>
        </div>
      </Card>

      <Section title="Your details">
        <Card>
          <dl className="divide-y divide-slate-100">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-sm font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Section>

      <p className="text-center text-xs text-slate-400">Need to update your details? Ask the front desk at your next visit.</p>
    </div>
  );
}
