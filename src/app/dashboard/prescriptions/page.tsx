import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listPrescriptions } from "@/services/prescription.service";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Prescriptions" };

export default async function PrescriptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const { items, meta } = await listPrescriptions(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Prescriptions</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Issued</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No prescriptions yet</td></tr>}
              {(items as unknown as Array<{ patientId: string; items: unknown[]; status: string; issuedAt?: string }>).map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{(p.patientId as string).slice(-6)}</td>
                  <td className="px-4 py-3">{(p.items?.length ?? 0)} medicines</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">{p.issuedAt ? new Date(p.issuedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-slate-400">{meta.total} total</p>
      </Card>
    </div>
  );
}
