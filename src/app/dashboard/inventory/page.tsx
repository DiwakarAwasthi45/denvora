import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listInventory } from "@/services/inventory.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const { items, meta } = await listInventory(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Inventory</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Reorder</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No inventory items yet</td></tr>}
              {(items as Array<{ name: string; category: string; quantity: number; reorderLevel: number }>).map((it, i) => {
                const low = it.quantity <= it.reorderLevel;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{it.name}</td>
                    <td className="px-4 py-3">{it.category}</td>
                    <td className="px-4 py-3">{it.quantity}</td>
                    <td className="px-4 py-3">{it.reorderLevel}</td>
                    <td className="px-4 py-3">{low ? <Badge tone="danger">Low</Badge> : <Badge tone="success">OK</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-slate-400">{meta.total} total</p>
      </Card>
    </div>
  );
}
