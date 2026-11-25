import { FreeDomainClaimRequest, FreeDomainClaimResponse } from "@nosweat/schema";
import { connectDomainToSite, getDomainState } from "@/server/domains";
import { claimFreeDomain, freeDomainMaxCents } from "@/server/domains/free-domain";
import { freeDomainStatus } from "@/server/domains/free-domain-access";
import { getFreeDomainStore } from "@/server/domains/free-domain-store";
import { getRegistrar } from "@/server/domains/registrar";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { RateLimiter } from "@/server/notify/rate-limit";
import { requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

const ROUTE = "/api/sites/[id]/free-domain/claim";

// Freio para cliques repetidos (cada pedido consulta o registro). A trava de verdade contra
// comprar duas vezes é a linha `pending` no banco (free-domain.ts).
const perHour = new RateLimiter(6, 60 * 60 * 1000);

/**
 * POST /api/sites/[id]/free-domain/claim: { domain, registrant } → compra o domínio grátis do
 * Premium no nome do cliente e liga ao site. Um por conta, para sempre. Os dados do dono do
 * domínio (endereço, telefone) vão só para o registro; nada disso é gravado aqui.
 * O "ver como" do admin nunca chega aqui: o proxy.ts recusa escritas em /api/* nesse modo.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    // O domínio fica no nome da conta: só a própria conta pede (nem o admin pelo cliente).
    if (site.ownerId !== user.id) {
      return errorResponse(403, "unauthorized", "Only the account owner can claim a free domain.");
    }

    const status = await freeDomainStatus(user.id);
    if (status.state === "locked" || status.state === "awaiting_payment") {
      return errorResponse(
        402,
        "payment_required",
        "A free domain is included with the Premium plan after your first payment.",
      );
    }
    if (status.state === "coming_soon") return comingSoon();
    if (status.state === "claimed") {
      return errorResponse(409, "conflict", "You already claimed your free domain.");
    }
    if (site.customDomain) {
      return errorResponse(
        409,
        "conflict",
        "This website already has a domain. Remove it first, or claim your free domain from another website.",
      );
    }
    const registrar = getRegistrar();
    if (!registrar) return comingSoon();

    const input = await readJson(request, FreeDomainClaimRequest);
    if (!input.ok) return input.response;

    if (!perHour.take(user.id)) {
      return errorResponse(429, "quota_exceeded", "Please wait a few minutes and try again.");
    }

    const outcome = await claimFreeDomain(
      {
        store: getFreeDomainStore(),
        registrar,
        maxCents: freeDomainMaxCents(),
        connect: async (domain) => {
          // Lê o site de novo: pode ter mudado enquanto a compra corria.
          const fresh = (await getSiteStore().get(site.id)) ?? site;
          const updated = await connectDomainToSite(fresh, domain);
          if (!updated) throw new Error("Site not found");
        },
      },
      {
        userId: user.id,
        siteId: site.id,
        domain: input.data.domain,
        registrant: input.data.registrant,
      },
    );
    if (!outcome.ok) {
      if (outcome.uncertain) {
        // A compra pode ter saído: a equipe confere o pedido (free_domain_claims, status pending).
        await reportError({
          route: ROUTE,
          message:
            "Free domain purchase is uncertain. Check the pending row in free_domain_claims.",
        });
      }
      return errorResponse(outcome.status, outcome.code, outcome.message);
    }

    const current = (await getSiteStore().get(site.id)) ?? site;
    return jsonResponse(FreeDomainClaimResponse, {
      status: await freeDomainStatus(user.id),
      domain: await getDomainState(current),
    });
  }, ROUTE);
}

function comingSoon(): Response {
  return errorResponse(503, "not_implemented", "Free domains are coming soon.");
}
