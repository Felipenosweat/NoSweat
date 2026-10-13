import { BillingStatusResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { getBillingStatus } from "@/server/billing";
import { handle, jsonResponse, unauthorized } from "@/server/http";

/** GET /api/me/billing → plano e situação da assinatura da conta. */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return jsonResponse(BillingStatusResponse, await getBillingStatus(user));
  });
}
