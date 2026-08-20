import { type NextRequest } from "next/server";
import { updateSession as updateAuthSession } from "@james-andsons/auth/middleware";

export async function updateSession(request: NextRequest) {
  return updateAuthSession(request, { protectAdmin: false });
}
