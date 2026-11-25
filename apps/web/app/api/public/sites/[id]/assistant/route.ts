import { AssistantChatRequest, AssistantChatResponse } from "@nosweat/schema";
import { chatWithAssistant } from "@/server/assistant/service";
import { isLikelyBot } from "@/server/bots";
import { errorResponse, handle, jsonResponse, notFound, readJson } from "@/server/http";
import { requestIpHash } from "@/server/ip";
import { clientIp } from "@/server/notify";
import { getSiteStore } from "@/server/store";

// POST /api/public/sites/<id>/assistant: o widget do atendente de IA do site publicado (público,
// sem sessão; também no domínio do cliente, onde o proxy.ts deixa /api/* passar). Cobra os
// créditos do DONO (server/assistant). Robôs conhecidos e o campo-isca preenchido são recusados.

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    if (!UUID.test(id)) return notFound();
    if (isLikelyBot(request.headers.get("user-agent"))) {
      return errorResponse(403, "invalid_request", "Chat is not available.");
    }

    const input = await readJson(request, AssistantChatRequest);
    if (!input.ok) return input.response;
    if (input.data.company) return errorResponse(403, "invalid_request", "Chat is not available.");

    const site = await getSiteStore().get(id);
    if (!site || site.status !== "published") return notFound();

    const ipHash = await requestIpHash(request.headers);
    const outcome = await chatWithAssistant({
      site,
      conversationId: input.data.conversationId,
      message: input.data.message,
      ipHash,
      ipKey: ipHash ?? clientIp(request),
      requestUrl: request.url,
    });
    if (!outcome.ok) return errorResponse(outcome.status, outcome.code, outcome.message);
    return jsonResponse(AssistantChatResponse, outcome.body);
  }, "/api/public/sites/[id]/assistant");
}
