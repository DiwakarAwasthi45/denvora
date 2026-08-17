import { route, apiSuccess } from "@/lib/api";
import { listBranches, createBranch, deleteBranch } from "@/services/branch.service";
import { getTenantContext } from "@/services/access.service";
import { createBranchSchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (_request: Request) => {
  const context = await getTenantContext();
  const branches = await listBranches(context);
  return apiSuccess({ items: branches });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createBranchSchema.parse(body);
  const branch = await createBranch(context, input);
  return apiSuccess(branch, undefined, 201);
});

export const DELETE = route(async (request: Request) => {
  const context = await getTenantContext();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ success: false, message: "id required" }), { status: 400 });
  await deleteBranch(context, id);
  return apiSuccess({ deleted: true });
});
