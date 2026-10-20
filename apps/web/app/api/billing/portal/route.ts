import { RedirectResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { createPortalUrl, getStripeConfig, StripeError } from "@/server/billing";
import { errorResponse, handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { appOrigin } from "@/server/notify";

/** POST /api/billing/portal → { url } do portal do Stripe (trocar plano, cartão, cancelar). */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const config = getStripeConfig();
    if (!config) return errorResponse(501, "not_implemented", "Payments are not set up yet.");
    try {
      const url = await createPortalUrl(config, user, appOrigin(request.url));
      if (!url) return notFound("Subscription");
      return jsonResponse(RedirectResponse, { url });
    } catch (error) {
      if (error instanceof StripeError) {
        console.error("[billing] portal failed", error.status, error.message);
        return errorResponse(502, "internal_error", "We couldn't open billing. Please try again.");
      }
      throw error;
    }
  }, "/api/billing/portal");
}
