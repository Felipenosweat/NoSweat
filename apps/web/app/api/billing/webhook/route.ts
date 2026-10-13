import { getStripeConfig, handleStripeEvent, verifyWebhookSignature } from "@/server/billing";
import { errorResponse } from "@/server/http";

/**
 * POST /api/billing/webhook: avisos do Stripe (pagamento feito, plano trocado, cancelado).
 * Público, mas só aceita eventos com assinatura válida (STRIPE_WEBHOOK_SECRET).
 */
export async function POST(request: Request): Promise<Response> {
  const config = getStripeConfig();
  if (!config?.webhookSecret) {
    return errorResponse(501, "not_implemented", "Payments are not set up yet.");
  }
  const payload = await request.text();
  if (
    !verifyWebhookSignature(payload, request.headers.get("stripe-signature"), config.webhookSecret)
  ) {
    return errorResponse(400, "invalid_request", "Invalid signature.");
  }
  let event: Parameters<typeof handleStripeEvent>[1];
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return errorResponse(400, "invalid_request", "Invalid payload.");
  }
  try {
    await handleStripeEvent(config, event);
  } catch (error) {
    // 500 faz o Stripe tentar de novo mais tarde.
    console.error("[billing] webhook failed", event.type, error);
    return errorResponse(500, "internal_error", "Webhook handling failed.");
  }
  return Response.json({ received: true });
}
