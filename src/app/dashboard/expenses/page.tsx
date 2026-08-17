import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listExpenses, expensesSummary } from "@/services/expense.service";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const [{ items, meta }, summary] = await Promise.all([
    listExpenses(context, { page: 1, limit: 50, month }),
    expensesSummary(context, month),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Expenses</h1>
        <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
          {month} total: NPR {summary.total.toLocaleString()}
        </span>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No expenses yet</td></tr>}
              {(items as unknown as Array<{ description: string; category: string; vendor: string; amount: number; date?: string }>).map((e, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{e.description}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">{e.vendor || "—"}</td>
                  <td className="px-4 py-3">NPR {e.amount?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3">{e.date ? new Date(e.date).toLocaleDateString() : "—"}</td>
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
