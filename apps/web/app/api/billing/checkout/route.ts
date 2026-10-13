import { CheckoutRequest, RedirectResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { createCheckoutUrl, getStripeConfig, StripeError } from "@/server/billing";
import { errorResponse, handle, jsonResponse, readJson, unauthorized } from "@/server/http";
import { appOrigin } from "@/server/notify";

/** POST /api/billing/checkout: { plan, interval, siteId? } → { url } da página de pagamento. */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const config = getStripeConfig();
    if (!config) return errorResponse(501, "not_implemented", "Payments are not set up yet.");

    const input = await readJson(request, CheckoutRequest);
    if (!input.ok) return input.response;

    try {
      const url = await createCheckoutUrl(config, user, input.data, appOrigin(request.url));
      return jsonResponse(RedirectResponse, { url });
    } catch (error) {
      if (error instanceof StripeError) {
        console.error("[billing] checkout failed", error.status, error.message);
        return errorResponse(
          502,
          "internal_error",
          "We couldn't start the payment. Please try again.",
        );
      }
      throw error;
    }
  });
}
