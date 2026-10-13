import { LeadCreatedResponse, LeadRequest, LeadsResponse } from "@nosweat/schema";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { RateLimiter, appOrigin, clientIp, notifyOwnerOfLead } from "@/server/notify";
import { liveSpec, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** Até 5 envios a cada 10 minutos por IP + site (em memória, melhor esforço: ver rate-limit.ts). */
const leadLimiter = new RateLimiter(5, 10 * 60 * 1000);

/**
 * POST /api/sites/[id]/leads: formulário de contato de um site PUBLICADO (público, sem login).
 * Limita envios por IP e avisa o dono por e-mail depois da resposta (server/notify).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const store = getSiteStore();
    const site = await store.get(id);
    if (!site || site.status !== "published") return notFound();

    if (!leadLimiter.take(`${clientIp(request)}:${site.id}`)) {
      return errorResponse(
        429,
        "quota_exceeded",
        "Too many messages in a short time. Please wait a few minutes and try again.",
      );
    }

    const input = await readJson(request, LeadRequest);
    if (!input.ok) return input.response;

    const { name, email, phone, message } = input.data;
    await store.addLead(site.id, {
      name,
      email: email || null,
      phone: phone || null,
      message,
    });

    // O pedido já está salvo: o e-mail é extra e nunca derruba a resposta.
    const spec = liveSpec(site);
    notifyOwnerOfLead({
      siteId: site.id,
      siteName: spec.business.name,
      ownerId: site.ownerId,
      fallbackEmail: spec.business.email ?? null,
      lead: { name, email: email || null, phone: phone || null, message },
      appOrigin: appOrigin(request.url),
    });
    return jsonResponse(LeadCreatedResponse, { ok: true }, 201);
  });
}

/** GET /api/sites/[id]/leads → pedidos de contato do site (só o dono ou um admin). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    return jsonResponse(LeadsResponse, { leads: await getSiteStore().listLeads(site.id) });
  });
}
