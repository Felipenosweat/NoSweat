import { z } from "zod";
import { getSiteStore, type SiteRecord } from "../store";
import { serviceConfig, type ServiceConfig } from "./auth-api";

// Quantos pedidos (formulário de contato) cada site recebeu, para a coluna "Requests" das contas
// no /admin. Só conta: nunca lê nome, e-mail ou mensagem de quem pediu (dado privado do cliente).

const PAGE = 1000;
/** Teto de páginas (50 mil pedidos). Acima disso os números ficam "pelo menos". */
const MAX_PAGES = 50;

const LeadSiteRows = z.array(z.object({ site_id: z.string() }));

/**
 * Supabase: baixa só a coluna `site_id` dos pedidos, em páginas de 1000 (o PostgREST não soma por
 * grupo sem as agregações ligadas), e conta por site.
 */
export async function countLeadsBySiteFromSupabase(
  config: ServiceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchImpl(
      `${config.url}/rest/v1/leads?select=site_id&order=id&limit=${PAGE}&offset=${page * PAGE}`,
      {
        cache: "no-store",
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      },
    );
    if (!res.ok) throw new Error(`Supabase leads request failed (${res.status})`);
    const rows = LeadSiteRows.parse(await res.json());
    for (const row of rows) counts.set(row.site_id, (counts.get(row.site_id) ?? 0) + 1);
    if (rows.length < PAGE) break;
  }
  return counts;
}

/** Pedidos por site (id do site → quantidade). Sem Supabase, lê do store em memória. */
export async function countLeadsBySite(sites: SiteRecord[]): Promise<Map<string, number>> {
  const config = serviceConfig();
  if (config) return countLeadsBySiteFromSupabase(config);
  const store = getSiteStore();
  const entries = await Promise.all(
    sites.map(async (site) => [site.id, (await store.listLeads(site.id)).length] as const),
  );
  return new Map(entries);
}

/** Soma os pedidos dos sites de cada dono (id da conta → quantidade). */
export function leadsByOwner(
  sites: Pick<SiteRecord, "id" | "ownerId">[],
  bySite: Map<string, number>,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    totals.set(site.ownerId, (totals.get(site.ownerId) ?? 0) + (bySite.get(site.id) ?? 0));
  }
  return totals;
}
