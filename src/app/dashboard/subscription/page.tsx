import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { PRICING } from "@/constants/config";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const plans = PRICING.plans;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Subscription Plans</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className="p-5">
            <p className="text-lg font-semibold text-slate-900">{p.name}</p>
            <p className="mt-1 text-2xl font-bold text-teal-700">NPR {p.monthlyPrice}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {p.features.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
