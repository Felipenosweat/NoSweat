import { FreeDomainStatusResponse } from "@nosweat/schema";
import { freeDomainStatus } from "@/server/domains/free-domain-access";
import { handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { requireOwnedSite } from "@/server/sites";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/sites/[id]/free-domain → estado do domínio grátis da conta dona do site (Premium):
 * locked, awaiting_payment, coming_soon, available ou claimed (+ o pedido, se houver).
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    return jsonResponse(FreeDomainStatusResponse, await freeDomainStatus(site.ownerId ?? user.id));
  }, "/api/sites/[id]/free-domain");
}
