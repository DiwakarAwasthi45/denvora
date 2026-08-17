import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listLeads } from "@/services/lead.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Leads" };

const TONE: Record<string, "default" | "warning" | "success" | "danger" | "neutral"> = {
  new: "neutral", contacted: "warning", consultation: "warning", treatment: "neutral", converted: "success", lost: "danger",
};

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const { items, meta } = await listLeads(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Leads</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No leads yet</td></tr>}
              {(items as Array<{ name: string; phone: string; source: string; status: string }>).map((l, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.name}</td>
                  <td className="px-4 py-3">{l.phone || "—"}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[l.status] ?? "default"}>{l.status}</Badge></td>
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
