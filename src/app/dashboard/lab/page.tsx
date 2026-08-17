import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listLabCases } from "@/services/lab.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Lab Cases" };

const TONE: Record<string, "default" | "warning" | "success" | "danger" | "neutral"> = {
  requested: "warning", sent: "neutral", in_lab: "neutral", received: "neutral", delivered: "success", cancelled: "danger",
};

export default async function LabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const { items, meta } = await listLabCases(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Lab Cases</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Lab</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Due</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No lab cases yet</td></tr>}
              {(items as unknown as Array<{ patientId: string; description: string; labName: string; status: string; dueDate?: string }>).map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{(c.patientId as string).slice(-6)}</td>
                  <td className="px-4 py-3">{c.description}</td>
                  <td className="px-4 py-3">{c.labName || "—"}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[c.status] ?? "default"}>{c.status}</Badge></td>
                  <td className="px-4 py-3">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}</td>
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
