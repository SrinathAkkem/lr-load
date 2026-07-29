import { jsonOk } from "@/lib/api/response";
import { getSmsConfigStatus } from "@/lib/otp/config";

/** Public config check — no secrets exposed. Use after deploying env vars. */
export async function GET() {
  return jsonOk(getSmsConfigStatus());
}
