import { z } from "zod";
import { getSiteStore, type SiteRecord } from "../store";
import { serviceConfig, type ServiceConfig } from "./auth-api";

// Quantos pedidos (formulário de contato) cada site recebeu, para a coluna "Requests" das contas
// no /admin. Só conta: nunca lê nome, e-mail ou mensagem de quem pediu (dado privado do cliente).

const PAGE = 1000;
/** Teto de páginas (50 mil pedidos). Acima disso os números ficam "pelo menos". */
const MAX_PAGES = 50;
/** Páginas pedidas ao mesmo tempo depois da primeira (sem sobrecarregar o PostgREST). */
const CONCURRENCY = 6;

const LeadSiteRows = z.array(z.object({ site_id: z.string() }));

/**
 * Supabase: baixa só a coluna `site_id` dos pedidos, em páginas de 1000 (o PostgREST não soma por
 * grupo sem as agregações ligadas), e conta por site. A primeira página vem com o total
 * (`Prefer: count=exact`, no Content-Range); as outras são pedidas em paralelo, em vez de uma
 * depois da outra. Sem o total, volta ao jeito antigo (página por página até acabar).
 */
export async function countLeadsBySiteFromSupabase(
  config: ServiceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const fetchPage = async (page: number, withTotal: boolean) => {
    const res = await fetchImpl(
      `${config.url}/rest/v1/leads?select=site_id&order=id&limit=${PAGE}&offset=${page * PAGE}`,
      {
        cache: "no-store",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          ...(withTotal ? { Prefer: "count=exact" } : {}),
        },
      },
    );
    if (!res.ok) throw new Error(`Supabase leads request failed (${res.status})`);
    const rows = LeadSiteRows.parse(await res.json());
    const total = withTotal ? Number(res.headers.get("content-range")?.split("/")[1]) : Number.NaN;
    return { rows, total };
  };
  const add = (rows: z.infer<typeof LeadSiteRows>) => {
    for (const row of rows) counts.set(row.site_id, (counts.get(row.site_id) ?? 0) + 1);
  };

  const first = await fetchPage(0, true);
  add(first.rows);
  if (first.rows.length < PAGE) return counts;

  if (Number.isFinite(first.total)) {
    const pages = Math.min(MAX_PAGES, Math.ceil(first.total / PAGE));
    const rest = Array.from({ length: Math.max(0, pages - 1) }, (_, i) => i + 1);
    for (let i = 0; i < rest.length; i += CONCURRENCY) {
      const batch = await Promise.all(
        rest.slice(i, i + CONCURRENCY).map((page) => fetchPage(page, false)),
      );
      for (const { rows } of batch) add(rows);
    }
    return counts;
  }

  for (let page = 1; page < MAX_PAGES; page++) {
    const { rows } = await fetchPage(page, false);
    add(rows);
    if (rows.length < PAGE) break;
  }
  return counts;
}

/**
 * Pedidos por site (id do site → quantidade). Com Supabase, uma leitura só da tabela de pedidos
 * (não precisa da lista de sites). Sem Supabase, conta no store em memória site por site (dev):
 * por isso a lista de sites vem como função, só chamada nesse caso.
 */
export async function countLeadsBySite(
  getSites: () => Promise<Pick<SiteRecord, "id">[]> = () => getSiteStore().listAllSummaries(),
): Promise<Map<string, number>> {
  const config = serviceConfig();
  if (config) return countLeadsBySiteFromSupabase(config);
  const store = getSiteStore();
  const sites = await getSites();
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
