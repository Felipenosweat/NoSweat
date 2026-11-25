import type { FreeDomainStatusResponse } from "@nosweat/schema";
import { isAdmin } from "../admin";
import { getGrantStore, isGrantActive, ownerHasFeature } from "../billing";
import { getBillingStore } from "../billing/store";
import { MAX_ATTEMPTS, purchaseEnabled, syncAutoRenew, toClaimInfo } from "./free-domain";
import { getFreeDomainStore, type FreeDomainClaim } from "./free-domain-store";
import { getRegistrar } from "./registrar";

// Quem pode pedir o domínio grátis e o que o cartão de /sites/[id] mostra. Separado das regras
// puras (free-domain.ts) porque depende do plano (server/billing) e do banco.

/**
 * - locked: o plano ativo não tem `freeDomain` (só o Premium tem);
 * - awaiting_payment: Premium pelo Stripe, mas o 1º pagamento ainda não entrou (status diferente
 *   de `active`: teste, incompleto, atrasado);
 * - ok: Premium pago (Stripe `active`) ou liberado à mão e valendo. Admins: liberado (testes da
 *   equipe; a compra ainda exige DOMAIN_PURCHASE_ENABLED).
 */
export async function freeDomainEligibility(
  userId: string,
): Promise<"locked" | "awaiting_payment" | "ok"> {
  if (!(await ownerHasFeature(userId, "freeDomain"))) return "locked";
  if (await isAdmin(userId)) return "ok";
  const [sub, grant] = await Promise.all([
    getBillingStore().get(userId),
    getGrantStore().get(userId),
  ]);
  if (isGrantActive(grant) && grant.plan === "premium") return "ok";
  if (sub?.plan === "premium" && sub.status === "active") return "ok";
  return "awaiting_payment";
}

/** Estado do cartão a partir do pedido (se houver) e do plano. */
export function stateFor(
  claim: FreeDomainClaim | null,
  eligibility: "locked" | "awaiting_payment" | "ok",
): FreeDomainStatusResponse {
  const info = claim ? toClaimInfo(claim) : null;
  // Pedido vivo (ou recusado sem mais tentativas): um por conta, para sempre.
  if (claim && (claim.status !== "failed" || claim.attempts >= MAX_ATTEMPTS)) {
    return { state: "claimed", claim: info };
  }
  if (eligibility === "locked") return { state: "locked", claim: info };
  if (eligibility === "awaiting_payment") return { state: "awaiting_payment", claim: info };
  if (!purchaseEnabled()) return { state: "coming_soon", claim: info };
  return { state: "available", claim: info };
}

/** Estado completo da conta. Erro no banco sobe (quem chama decide). */
export async function freeDomainStatus(userId: string): Promise<FreeDomainStatusResponse> {
  const [claim, eligibility] = await Promise.all([
    getFreeDomainStore().get(userId),
    freeDomainEligibility(userId),
  ]);
  return stateFor(claim, eligibility);
}

/**
 * `true` se `domain` é o domínio grátis que compramos para `userId` (dispensa a prova de dono e
 * os registros de DNS: o DNS já é da Vercel). Erro no banco = `false`.
 */
export async function isOwnFreeDomain(userId: string | null, domain: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const claim = await getFreeDomainStore().get(userId);
    return claim?.status === "purchased" && claim.domain === domain.toLowerCase();
  } catch (error) {
    console.error("[free-domain] could not read the claim", error);
    return false;
  }
}

/**
 * Cron diário (/api/cron/cleanup-guests): renovação automática ligada só enquanto o dono tiver o
 * Premium. Desligado sem DOMAIN_PURCHASE_ENABLED=true ou sem registro (`null`).
 */
export async function syncFreeDomainAutoRenew(): Promise<{
  checked: number;
  changed: number;
  failed: number;
} | null> {
  if (!purchaseEnabled()) return null;
  const registrar = getRegistrar();
  if (!registrar) return null;
  return syncAutoRenew({
    store: getFreeDomainStore(),
    registrar,
    keepRenewing: (userId) => ownerHasFeature(userId, "freeDomain"),
  });
}
