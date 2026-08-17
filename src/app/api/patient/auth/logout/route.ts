import { route, apiSuccess } from "@/lib/api";
import { clearPatientCookie } from "@/lib/patient-session";

export const POST = route(async () => {
  const res = apiSuccess({ ok: true });
  res.headers.append("Set-Cookie", clearPatientCookie());
  return res;
});
