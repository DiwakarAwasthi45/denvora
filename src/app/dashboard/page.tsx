import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCurrentClinic } from "@/services/clinic.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;
  const clinic = user.clinicId ? await getCurrentClinic({ userId: user.id, clinicId: user.clinicId, branchId: user.branchId ?? null, role: user.role ?? null, roleId: user.roleId ?? null, permissions: user.permissions ?? [], isPlatform: user.isPlatform ?? false }) : null;

  const needsOnboarding = clinic?.status === "pending";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clinic ? `${clinic.name} · ${clinic.city || clinic.slug}` : "Your clinic workspace"}
          </p>
        </div>
      </div>

      {needsOnboarding && (
        <Card className="mb-8 border-teal-200 bg-teal-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-teal-100">
                <Building2 className="size-5 text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-900">Finish setting up your clinic</p>
                <p className="text-sm text-teal-700">
                  Add your address, working hours and chairs to activate {clinic?.name}.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Continue setup
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-teal-600" />
              Clinic
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-slate-900">{clinic?.name ?? "—"}</p>
            <p className="mt-1 text-slate-500">{clinic?.address || clinic?.city || "Address not set"}</p>
            <p className="mt-3">
              <Badge tone={clinic?.status === "active" ? "success" : "warning"}>
                {clinic?.status ?? "pending"}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-teal-600" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="mt-0.5">
                  <Badge>{user.role ?? "unassigned"}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Permissions</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{user.permissions.length} granted</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/dashboard/users"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-teal-300 hover:bg-teal-50/50"
                >
                  <span className="font-medium text-slate-700">Invite your team</span>
                  <ArrowRight className="size-4 text-slate-400" />
                </Link>
              </li>
              {clinic?.status === "active" && (
                <li>
                  <Link
                    href="/onboarding"
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-teal-300 hover:bg-teal-50/50"
                  >
                    <span className="font-medium text-slate-700">Clinic settings</span>
                    <ArrowRight className="size-4 text-slate-400" />
                  </Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
