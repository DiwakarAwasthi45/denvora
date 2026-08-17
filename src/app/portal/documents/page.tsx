"use client";

import { usePatient } from "@/components/portal/PatientShell";
import { Card, Section, Empty, fmtDate } from "@/components/portal/ui";

export default function PortalDocuments() {
  const { data } = usePatient();
  const has = data.documents.length > 0 || data.xrays.length > 0;

  return (
    <div className="space-y-5">
      <Section title="X-rays & imaging">
        {data.xrays.length === 0 ? <Empty text="No X-rays shared yet." /> : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.xrays.map((x) => (
              <Card key={x.id} className="p-3">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  {x.thumbnailUrl || x.imageUrl ? (
                    <img src={x.thumbnailUrl ?? x.imageUrl} alt={x.region} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No preview</div>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">{x.region || x.type}</p>
                <p className="text-xs text-slate-400">{fmtDate(x.capturedAt)}</p>
                {x.imageUrl && <a href={x.imageUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">View full</a>}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Documents">
        {data.documents.length === 0 ? <Empty text="No documents shared yet." /> : (
          <div className="space-y-2">
            {data.documents.map((d) => (
              <Card key={d.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{d.title || d.type}</p>
                    <p className="text-xs text-slate-400">{fmtDate(d.createdAt)}</p>
                  </div>
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">Open</a>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {!has && <p className="text-center text-sm text-slate-400">Your clinic will share documents and X-rays here.</p>}
    </div>
  );
}
