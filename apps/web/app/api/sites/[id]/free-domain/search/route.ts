import { FreeDomainSearchRequest, FreeDomainSearchResponse } from "@nosweat/schema";
import { freeDomainMaxCents, searchFreeDomain } from "@/server/domains/free-domain";
import { freeDomainStatus } from "@/server/domains/free-domain-access";
import { getRegistrar } from "@/server/domains/registrar";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { RateLimiter } from "@/server/notify/rate-limit";
import { requireOwnedSite } from "@/server/sites";

type Context = { params: Promise<{ id: string }> };

// Cada busca é uma chamada ao registro (até 8 nomes). Limite por conta, em memória por instância
// (melhor esforço, como em server/notify/rate-limit.ts).
const perBurst = new RateLimiter(10, 10 * 60 * 1000);
const perDay = new RateLimiter(40, 24 * 60 * 60 * 1000);

/**
 * POST /api/sites/[id]/free-domain/search: { query } → o domínio pedido (disponível? grátis?) e,
 * se não sair de graça, sugestões disponíveis a partir do nome e da cidade do site.
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
    const registrar = getRegistrar();
    if (!registrar) return comingSoon();

    const input = await readJson(request, FreeDomainSearchRequest);
    if (!input.ok) return input.response;

    if (!perBurst.take(user.id) || !perDay.take(user.id)) {
      return errorResponse(
        429,
        "quota_exceeded",
        "That's a lot of searches. Please wait a few minutes and try again.",
      );
    }

    const { business } = site.spec;
    const outcome = await searchFreeDomain(
      { registrar, maxCents: freeDomainMaxCents() },
      input.data.query,
      { name: business.name, city: business.city },
    );
    if (!outcome.ok) return errorResponse(outcome.status, outcome.code, outcome.message);
    return jsonResponse(FreeDomainSearchResponse, outcome.response);
  }, "/api/sites/[id]/free-domain/search");
}

function comingSoon(): Response {
  return errorResponse(503, "not_implemented", "Free domains are coming soon.");
}
