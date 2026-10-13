import { LeadCreatedResponse, LeadRequest, LeadsResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/leads: formulário de contato de um site PUBLICADO (público, sem login).
 * TODO: limitar envios por IP (rate limit) e avisar o dono por e-mail.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const store = getSiteStore();
    const site = await store.get(id);
    if (!site || site.status !== "published") return notFound();

    const input = await readJson(request, LeadRequest);
    if (!input.ok) return input.response;

    const { name, email, phone, message } = input.data;
    await store.addLead(site.id, {
      name,
      email: email || null,
      phone: phone || null,
      message,
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
