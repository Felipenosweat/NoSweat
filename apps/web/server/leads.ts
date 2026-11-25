import { appOrigin, notifyOwnerOfLead } from "./notify";
import { liveSpec } from "./sites";
import { getSiteStore, type LeadRecord, type NewLead, type SiteRecord } from "./store";

// Pedidos de contato de um site publicado: o formulário do site (POST /api/sites/[id]/leads) e o
// atendente de IA (server/assistant) passam por aqui. O pedido vira cliente no CRM do dono
// (syncLeadsToClients) e o dono recebe o e-mail de sempre (server/notify).

// Anti-spam: no máximo 5 mensagens por hora da mesma rede (IP ou prefixo IPv6) em cada site,
// contadas no banco (vale entre servidores). Sem teto por site: um atacante poderia esgotá-lo
// e calar o formulário do negócio por um dia.
export const LEADS_PER_IP_PER_HOUR = 5;

export type SaveLeadResult = { ok: true; lead: LeadRecord } | { ok: false; reason: "rate_limited" };

/**
 * Confere o limite por rede, grava o pedido e avisa o dono por e-mail depois da resposta.
 * `requestUrl`: o endereço do pedido (para o link do painel no e-mail).
 */
export async function saveSiteLead(
  site: SiteRecord,
  lead: NewLead,
  ipHash: string | null,
  requestUrl: string,
): Promise<SaveLeadResult> {
  const store = getSiteStore();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const fromThisIp = ipHash ? await store.countLeads(site.id, hourAgo, ipHash) : 0;
  if (fromThisIp >= LEADS_PER_IP_PER_HOUR) return { ok: false, reason: "rate_limited" };

  const saved = await store.addLead(site.id, lead, ipHash);

  // O pedido já está salvo: o e-mail é extra e nunca derruba a resposta.
  const spec = liveSpec(site);
  notifyOwnerOfLead({
    siteId: site.id,
    siteName: spec.business.name,
    ownerId: site.ownerId,
    fallbackEmail: spec.business.email ?? null,
    lead,
    appOrigin: appOrigin(requestUrl),
  });
  return { ok: true, lead: saved };
}
