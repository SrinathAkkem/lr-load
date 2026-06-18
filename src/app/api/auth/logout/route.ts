import { clearSession } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/response";

export async function POST() {
  await clearSession();
  return jsonOk({ message: "Logged out" });
}
