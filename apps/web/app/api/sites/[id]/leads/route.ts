import { LeadCreatedResponse, LeadRequest, LeadsResponse } from "@nosweat/schema";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { requestIpHash } from "@/server/ip";
import { appOrigin, notifyOwnerOfLead } from "@/server/notify";
import { liveSpec, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

// Anti-spam: no máximo 5 mensagens por hora da mesma rede (IP ou prefixo IPv6) em cada site,
// contadas no banco (vale entre servidores). Sem teto por site: um atacante poderia esgotá-lo
// e calar o formulário do negócio por um dia.
const PER_IP_PER_HOUR = 5;

/**
 * POST /api/sites/[id]/leads: formulário de contato de um site PUBLICADO (público, sem login).
 * Limita envios por rede e avisa o dono por e-mail depois da resposta (server/notify).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const store = getSiteStore();
    const site = await store.get(id);
    if (!site || site.status !== "published") return notFound();

    const input = await readJson(request, LeadRequest);
    if (!input.ok) return input.response;

    // Robô (campo-isca preenchido): finge que deu certo e não guarda nada.
    if (input.data.company) return jsonResponse(LeadCreatedResponse, { ok: true }, 201);

    const ipHash = await requestIpHash(request.headers);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fromThisIp = ipHash ? await store.countLeads(site.id, hourAgo, ipHash) : 0;
    if (fromThisIp >= PER_IP_PER_HOUR) {
      return errorResponse(
        429,
        "quota_exceeded",
        "Too many messages were sent. Please try again later or call us instead.",
      );
    }

    const { name, email, phone, message } = input.data;
    await store.addLead(
      site.id,
      { name, email: email || null, phone: phone || null, message },
      ipHash,
    );

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
  }, "/api/sites/[id]/leads");
}

/** GET /api/sites/[id]/leads → pedidos de contato do site (só o dono ou um admin). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    return jsonResponse(LeadsResponse, { leads: await getSiteStore().listLeads(site.id) });
  }, "/api/sites/[id]/leads");
}
