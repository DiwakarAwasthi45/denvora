import { redirect } from "next/navigation";
import { getTenantContext } from "@/services/access.service";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await getTenantContext();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 lg:flex-row">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden lg:pl-64">{children}</main>
    </div>
  );
}
