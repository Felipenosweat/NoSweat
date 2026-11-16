import { z } from "zod";
import { getSiteStore } from "../store";
import { normalizeSupabaseUrl } from "../store/supabase";

// Visitas dos sites publicados (tabela site_visits, migration 0029) e o controle dos resumos
// mensais já enviados (monthly_reports). Supabase em produção, memória no dev/testes.
// Só contagem por dia (UTC): nenhum dado do visitante é guardado.

export interface VisitStore {
  /** Soma uma visita hoje. Site que não existe ou não está publicado não conta. */
  count(siteId: string): Promise<void>;
  /**
   * Visitas por site entre `fromDay` e `toDay` (YYYY-MM-DD, os dois incluídos). Sem `siteIds`,
   * todos os sites. Site sem visita não aparece no mapa.
   */
  totals(fromDay: string, toDay: string, siteIds?: string[]): Promise<Map<string, number>>;
  /** Marca o resumo do mês (`month` = primeiro dia) como enviado. `false` = já estava. */
  claimReport(ownerId: string, month: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Dia (UTC) de uma data, no formato da coluna `day`: YYYY-MM-DD. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const VisitRow = z.object({ site_id: z.string(), visits: z.coerce.number() });
const PAGE = 1000;

export class SupabaseVisitStore implements VisitStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1`;
  }

  private async call(path: string, init: RequestInit & { prefer?: string } = {}): Promise<unknown> {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...rest,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: prefer ?? "return=representation",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async count(siteId: string) {
    if (!UUID.test(siteId)) return;
    await this.call("/rpc/count_site_visit", {
      method: "POST",
      body: JSON.stringify({ p_site: siteId }),
    });
  }

  async totals(fromDay: string, toDay: string, siteIds?: string[]) {
    const totals = new Map<string, number>();
    if (!DAY.test(fromDay) || !DAY.test(toDay)) return totals;
    const ids = siteIds?.filter((id) => UUID.test(id));
    if (ids && ids.length === 0) return totals;
    const query =
      `/site_visits?day=gte.${fromDay}&day=lte.${toDay}` +
      (ids ? `&site_id=in.(${ids.join(",")})` : "") +
      "&select=site_id,visits&order=site_id.asc,day.asc";
    for (let offset = 0; ; offset += PAGE) {
      const page = await this.call(`${query}&limit=${PAGE}&offset=${offset}`);
      const rows = z.array(VisitRow).parse(page ?? []);
      for (const row of rows) totals.set(row.site_id, (totals.get(row.site_id) ?? 0) + row.visits);
      if (rows.length < PAGE) return totals;
    }
  }

  async claimReport(ownerId: string, month: string) {
    if (!UUID.test(ownerId) || !DAY.test(month)) return false;
    // ignore-duplicates: se a linha já existe, nada é gravado e a resposta vem vazia.
    const rows = await this.call("/monthly_reports?on_conflict=owner_id,month", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: JSON.stringify({ owner_id: ownerId, month }),
    });
    return Array.isArray(rows) && rows.length > 0;
  }
}

// ---------- Memória (dev e testes) ----------

const globalForVisits = globalThis as typeof globalThis & {
  __nosweatVisits?: Map<string, number>;
  __nosweatReports?: Set<string>;
};

export class MemoryVisitStore implements VisitStore {
  /** Chave: `<siteId>|<dia>`. */
  private get rows(): Map<string, number> {
    globalForVisits.__nosweatVisits ??= new Map();
    return globalForVisits.__nosweatVisits;
  }

  private get reports(): Set<string> {
    globalForVisits.__nosweatReports ??= new Set();
    return globalForVisits.__nosweatReports;
  }

  async count(siteId: string, now: Date = new Date()) {
    const site = await getSiteStore().get(siteId);
    if (site?.status !== "published") return;
    const key = `${siteId}|${dayKey(now)}`;
    this.rows.set(key, (this.rows.get(key) ?? 0) + 1);
  }

  async totals(fromDay: string, toDay: string, siteIds?: string[]) {
    const totals = new Map<string, number>();
    for (const [key, visits] of this.rows) {
      const [siteId, day] = key.split("|") as [string, string];
      if (day < fromDay || day > toDay) continue;
      if (siteIds && !siteIds.includes(siteId)) continue;
      totals.set(siteId, (totals.get(siteId) ?? 0) + visits);
    }
    return totals;
  }

  async claimReport(ownerId: string, month: string) {
    const key = `${ownerId}|${month}`;
    if (this.reports.has(key)) return false;
    this.reports.add(key);
    return true;
  }

  /** Só para testes: apaga tudo. */
  clear(): void {
    this.rows.clear();
    this.reports.clear();
  }
}

let store: VisitStore | undefined;

export function getVisitStore(): VisitStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseVisitStore({ url, serviceKey }) : new MemoryVisitStore();
  return store;
}
