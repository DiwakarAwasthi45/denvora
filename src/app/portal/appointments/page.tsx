"use client";

import { useState } from "react";
import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section, StatusPill, Empty, fmtDate } from "@/components/portal/ui";

export default function PortalAppointments() {
  const { data } = usePatient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const upcoming = data.appointments.filter((a) => ["scheduled", "confirmed"].includes(a.status));
  const past = data.appointments.filter((a) => !["scheduled", "confirmed"].includes(a.status));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")}>Upcoming ({upcoming.length})</TabBtn>
        <TabBtn active={tab === "past"} onClick={() => setTab("past")}>History ({past.length})</TabBtn>
      </div>

      <Section title={tab === "upcoming" ? "Upcoming" : "History"}>
        {list.length === 0 ? <Empty text={tab === "upcoming" ? "No upcoming appointments." : "No past visits."} /> : (
          <div className="space-y-2">
            {list.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{fmtDate(a.date)} · {a.startTime}–{a.endTime}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{a.dentistName ? `Dr. ${a.dentistName}` : "Dentist"} · {a.reason || a.type}</p>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
      {children}
    </button>
  );
}
