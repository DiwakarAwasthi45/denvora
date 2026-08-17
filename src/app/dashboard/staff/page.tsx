import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listAttendance } from "@/services/staff.service";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const { items, meta } = await listAttendance(context, { month, limit: 50 });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Staff & Attendance</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Check in</th><th className="px-4 py-3">Check out</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items as unknown[]).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No attendance records for {month}</td></tr>}
              {(items as unknown as Array<{ date: string; status: string; checkIn?: string; checkOut?: string }>).map((a, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{a.date}</td>
                  <td className="px-4 py-3">{a.status}</td>
                  <td className="px-4 py-3">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-slate-400">{meta.total} records</p>
      </Card>
    </div>
  );
}
