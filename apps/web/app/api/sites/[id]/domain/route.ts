import { ConnectDomainRequest, DomainResponse } from "@nosweat/schema";
import {
  addDomain,
  isReservedDomain,
  getDomainState,
  getVercelConfig,
  removeDomain,
  VercelDomainError,
} from "@/server/domains";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { requireOwnedSite } from "@/server/sites";
import { DomainTakenError, getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id]/domain → domínio, status (pending/active/manual) e registros de DNS. */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    return jsonResponse(DomainResponse, await getDomainState(site));
  });
}

/** PUT /api/sites/[id]/domain: { domain } → liga o domínio do cliente ao site. */
export async function PUT(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const input = await readJson(request, ConnectDomainRequest);
    if (!input.ok) return input.response;
    const { domain } = input.data;

    if (isReservedDomain(domain)) {
      return errorResponse(400, "invalid_request", "Please use your own business domain.");
    }

    const store = getSiteStore();
    const other = await store.getByDomain(domain);
    if (other && other.id !== site.id) return domainTaken(domain);

    const vercel = getVercelConfig();
    try {
      // Troca de domínio: solta o anterior antes de ligar o novo.
      if (vercel && site.customDomain && site.customDomain !== domain) {
        await removeDomain(vercel, site.customDomain);
      }
      if (vercel) await addDomain(vercel, domain);
      const updated = await store.updateMeta(site.id, { customDomain: domain });
      if (!updated) return notFound();
      return jsonResponse(DomainResponse, await getDomainState(updated));
    } catch (error) {
      if (error instanceof DomainTakenError) return domainTaken(domain);
      if (error instanceof VercelDomainError) {
        console.error("[domains] vercel error", error.code, error.message);
        return errorResponse(
          409,
          "domain_error",
          `We couldn't connect ${domain}: ${error.message}`,
        );
      }
      throw error;
    }
  });
}

/** DELETE /api/sites/[id]/domain → desliga o domínio próprio (o endereço grátis continua). */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const vercel = getVercelConfig();
    if (vercel && site.customDomain) await removeDomain(vercel, site.customDomain);
    const updated = await getSiteStore().updateMeta(site.id, { customDomain: null });
    if (!updated) return notFound();
    return jsonResponse(DomainResponse, await getDomainState(updated));
  });
}

function domainTaken(domain: string): Response {
  return errorResponse(409, "domain_taken", `${domain} is already connected to another website.`);
}
