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
import { saveSiteLead } from "@/server/leads";
import { requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

// Anti-spam (5 por hora por rede em cada site) e aviso ao dono: server/leads.ts (o atendente de
// IA do site usa o mesmo caminho).

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
    const { name, email, phone, message } = input.data;
    const saved = await saveSiteLead(
      site,
      { name, email: email || null, phone: phone || null, message },
      ipHash,
      request.url,
    );
    if (!saved.ok) {
      return errorResponse(
        429,
        "quota_exceeded",
        "Too many messages were sent. Please try again later or call us instead.",
      );
    }
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
