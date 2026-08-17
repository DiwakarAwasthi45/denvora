import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { getQueue, todayInTimezone } from "@/services/queue.service";
import { listAppointments } from "@/services/appointment.service";
import { Card } from "@/components/ui/Card";
import { QueueManager } from "@/components/dashboard/queue/QueueManager";

export const metadata = { title: "Queue" };

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const context = await getTenantContext();
  const canManage =
    context.isPlatform ||
    context.permissions.includes("queue.manage") ||
    context.permissions.includes("appointments.update");

  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="size-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your role does not allow you to manage the queue. Contact your clinic owner.
          </p>
        </Card>
      </div>
    );
  }

  const [queue, upcoming] = await Promise.all([
    getQueue(context, {}),
    listAppointments(context, { page: 1, limit: 50, date: todayInTimezone("Asia/Kathmandu") }),
  ]);

  return (
    <QueueManager
      queueItems={queue.items}
      chairs={queue.chairs}
      canManage={canManage}
      initialUpcoming={upcoming.items}
    />
  );
}
