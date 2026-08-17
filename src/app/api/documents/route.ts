import { route, apiSuccess } from "@/lib/api";
import { listDocuments, createDocument } from "@/services/document.service";
import { getTenantContext } from "@/services/access.service";
import { createDocumentSchema } from "@/validations/document.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const type = url.searchParams.get("type")?.trim() || undefined;
  const result = await listDocuments(context, { page, limit, patientId, type });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createDocumentSchema.parse(body);
  const doc = await createDocument(context, input);
  return apiSuccess(doc, undefined, 201);
});