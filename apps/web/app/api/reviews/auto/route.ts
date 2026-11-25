import { AutoReviewResponse, UpdateAutoReviewRequest } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { ownerHasFeature } from "@/server/billing";
import { errorResponse, handle, jsonResponse, readJson, unauthorized } from "@/server/http";
import { getAutoReviewSummary, setAutoReviewEnabled } from "@/server/review-requests/service";

/**
 * PUT /api/reviews/auto `{ enabled }` → `{ enabled, sentThisMonth }`. Liga ou desliga o pedido de
 * avaliação no Google automático (quando um job vira "done"). Ligar exige plano com o recurso
 * (Pro ou Premium; 402 `payment_required`); desligar sempre pode. No modo "ver como" do admin o
 * proxy.ts recusa esta escrita (403) antes de chegar aqui.
 */
export async function PUT(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = await readJson(request, UpdateAutoReviewRequest);
    if (!input.ok) return input.response;

    if (input.data.enabled && !(await ownerHasFeature(user.id, "autoReviewRequests"))) {
      return errorResponse(
        402,
        "payment_required",
        "Automatic review requests are part of the Pro and Premium plans.",
      );
    }
    await setAutoReviewEnabled(user.id, input.data.enabled);
    const summary = await getAutoReviewSummary(user.id);
    return jsonResponse(AutoReviewResponse, {
      enabled: input.data.enabled,
      sentThisMonth: summary.sentThisMonth,
    });
  }, "/api/reviews/auto");
}
