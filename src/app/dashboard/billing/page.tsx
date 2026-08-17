import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { BillingService } from "@/services/billing.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Billing" };

const TONE: Record<string, "default" | "warning" | "success" | "danger" | "neutral"> = {
  draft: "default", open: "warning", paid: "success", partial: "neutral", void: "danger",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const { items, meta } = await BillingService.listInvoices(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Billing & Invoices</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Number</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Issued</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No invoices yet</td></tr>}
              {(items as unknown as Array<{ number: string; total: number; amountPaid: number; status: string; issuedAt?: string }>).map((inv, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{inv.number}</td>
                  <td className="px-4 py-3">NPR {inv.total?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3">NPR {inv.amountPaid?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[inv.status] ?? "default"}>{inv.status}</Badge></td>
                  <td className="px-4 py-3">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "—"}</td>
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
