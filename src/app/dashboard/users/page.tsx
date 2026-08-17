import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantContext } from "@/services/access.service";
import { listClinicUsers } from "@/services/user.service";
import { getClinicRoles } from "@/services/clinic.service";
import { Card } from "@/components/ui/Card";
import { UsersManager } from "@/components/dashboard/users/UsersManager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const context = await getTenantContext();

  if (!context.isPlatform && !context.permissions.includes("users.view")) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="size-6 text-red-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your role does not allow you to manage users. Contact your clinic owner.
          </p>
        </Card>
      </div>
    );
  }

  const [initial, roles] = await Promise.all([
    listClinicUsers(context, { page: 1, limit: 20 }),
    getClinicRoles(context),
  ]);

  const roleOptions = roles.map((role) => ({
    _id: String(role._id),
    name: role.name,
    slug: role.slug,
  }));

  return (
    <UsersManager
      initialItems={initial.items}
      initialMeta={initial.meta}
      roles={roleOptions}
      canCreate={context.isPlatform || context.permissions.includes("users.create")}
      canUpdate={context.isPlatform || context.permissions.includes("users.update")}
      canDelete={context.isPlatform || context.permissions.includes("users.delete")}
      currentUserId={context.userId}
    />
  );
}
