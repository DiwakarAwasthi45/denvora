import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listTreatments } from "@/services/treatment.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TreatmentsClient } from "@/components/dashboard/treatments/TreatmentsClient";

export const metadata = { title: "Treatments" };

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  proposed: "warning",
  planned: "neutral",
  in_progress: "neutral",
  completed: "success",
  declined: "danger",
  on_hold: "default",
};

export default async function TreatmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();

  if (!context.isPlatform && !context.permissions.includes("treatments.view")) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <h1 className="text-lg font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-sm text-slate-500">Your role does not allow you to view treatments.</p>
        </Card>
      </div>
    );
  }

  const { items, meta } = await listTreatments(context, { page: 1, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Treatments</h1>
      <TreatmentsClient
        initialItems={items as unknown as Array<{ _id: string; patientId: string; diagnosis: string; procedure: string; status: string; cost: number }>}
        initialMeta={meta}
        canCreate={context.isPlatform || context.permissions.includes("treatments.create")}
        statusTone={STATUS_TONE}
      />
    </div>
  );
}
