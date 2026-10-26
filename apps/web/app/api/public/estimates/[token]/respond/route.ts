import { PublicEstimateResponse, RespondEstimateRequest } from "@nosweat/schema";
import { errorResponse, jsonResponse, notFound, readJson } from "@/server/http";
import { RateLimiter, appOrigin, clientIp, notifyOwnerOfEstimateAnswer } from "@/server/notify";
import { officeHandle } from "@/server/office/api";
import { estimateOwnerByToken, respondToEstimate } from "@/server/office/service";
import { isPublicToken } from "@/server/office/tokens";

type Context = { params: Promise<{ token: string }> };

// Anti-abuso (melhor esforço, em memória por instância, como em server/notify/rate-limit.ts):
// no máximo 20 respostas por hora do mesmo IP. A regra de verdade é a do service: um orçamento
// só aceita UMA resposta (a segunda recebe 409).
const limiter = new RateLimiter(20, 60 * 60 * 1000);

/**
 * POST /api/public/estimates/[token]/respond { decision: "approve", name, updatedAt? } |
 * { decision: "decline", reason?, updatedAt? }: resposta do cliente final pelo link. Público, sem
 * conta. `updatedAt` = o `PublicEstimate.updatedAt` que a página mostrou. Já respondido, vencido
 * ou mudado depois da versão vista → 409; rascunho ou token desconhecido → 404.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/estimates/[token]/respond", async () => {
    const { token } = await params;
    if (!isPublicToken(token)) return notFound("Estimate");
    if (!limiter.take(clientIp(request))) {
      return errorResponse(429, "quota_exceeded", "Too many attempts. Please try again later.");
    }
    const input = await readJson(request, RespondEstimateRequest);
    if (!input.ok) return input.response;
    const estimate = await respondToEstimate(token, input.data);
    if (!estimate) return notFound("Estimate");
    // Avisa o dono por e-mail (depois da resposta; erro aqui nunca derruba a aprovação).
    const owner = await estimateOwnerByToken(token).catch(() => null);
    if (owner) {
      notifyOwnerOfEstimateAnswer({
        ownerId: owner.ownerId,
        estimateId: owner.estimateId,
        number: estimate.number,
        title: estimate.title,
        clientName: estimate.client.name,
        decision: input.data.decision === "approve" ? "approved" : "declined",
        approvedByName: estimate.approvedByName,
        declineReason: input.data.decision === "decline" ? input.data.reason?.trim() || null : null,
        totalCents: estimate.totalCents,
        fallbackEmail: owner.companyEmail,
        appOrigin: appOrigin(request.url),
      });
    }
    return jsonResponse(PublicEstimateResponse, { estimate });
  });
}
