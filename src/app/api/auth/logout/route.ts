import { route, apiSuccess } from "@/lib/api";
import { signOut } from "@/lib/auth";

export const POST = route(async () => {
  await signOut({ redirect: false });
  return apiSuccess({ loggedOut: true });
});
