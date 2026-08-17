import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listAppointments, getAppointmentFormData } from "@/services/appointment.service";
import { todayInTimezone } from "@/services/queue.service";
import { Card } from "@/components/ui/Card";
import { AppointmentsManager } from "@/components/dashboard/appointments/AppointmentsManager";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const context = await getTenantContext();

  if (!context.isPlatform && !context.permissions.includes("appointments.view")) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="size-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your role does not allow you to view appointments. Contact your clinic owner.
          </p>
        </Card>
      </div>
    );
  }

  const [initial, formData] = await Promise.all([
    listAppointments(context, {
      page: 1,
      limit: 20,
      date: todayInTimezone("Asia/Kathmandu"),
    }),
    getAppointmentFormData(context),
  ]);

  return (
    <AppointmentsManager
      initialItems={initial.items}
      initialMeta={initial.meta}
      formData={formData}
      defaultDate={todayInTimezone("Asia/Kathmandu")}
      canCreate={context.isPlatform || context.permissions.includes("appointments.create")}
      canUpdate={context.isPlatform || context.permissions.includes("appointments.update")}
      canDelete={context.isPlatform || context.permissions.includes("appointments.delete")}
    />
  );
}
