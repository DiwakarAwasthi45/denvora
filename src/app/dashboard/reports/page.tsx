import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { revenueAnalytics, treatmentAnalytics, noShowAnalytics, retentionAnalytics } from "@/services/analytics.service";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const [rev, treat, noShow, ret] = await Promise.all([
    revenueAnalytics(context, month),
    treatmentAnalytics(context),
    noShowAnalytics(context),
    retentionAnalytics(context),
  ]);

  const cards = [
    { label: "Revenue (month)", value: `NPR ${(rev?.totalRevenue ?? 0).toLocaleString()}`, sub: `${(rev?.completed ?? 0)} paid invoices` },
    { label: "Treatments", value: `${(treat?.total ?? 0)}`, sub: `acceptance ${treat?.acceptanceRate ?? 0}%` },
    { label: "No-show Rate", value: `${noShow?.rate ?? 0}%`, sub: `${(noShow?.noShows ?? 0)} of ${(noShow?.total ?? 0)}` },
    { label: "Returning Patients", value: `${(ret?.returning ?? 0)}`, sub: `${(ret?.new ?? 0)} new` },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
