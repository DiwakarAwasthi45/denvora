import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listPatients } from "@/services/patient.service";
import { Card } from "@/components/ui/Card";
import { PatientsManager } from "@/components/dashboard/patients/PatientsManager";

export const metadata = { title: "Patients" };

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const context = await getTenantContext();

  if (!context.isPlatform && !context.permissions.includes("patients.view")) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="size-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your role does not allow you to view patients. Contact your clinic owner.
          </p>
        </Card>
      </div>
    );
  }

  const initial = await listPatients(context, { page: 1, limit: 20 });

  return (
    <PatientsManager
      initialItems={initial.items}
      initialMeta={initial.meta}
      canCreate={context.isPlatform || context.permissions.includes("patients.create")}
      canUpdate={context.isPlatform || context.permissions.includes("patients.update")}
      canDelete={context.isPlatform || context.permissions.includes("patients.delete")}
    />
  );
}
