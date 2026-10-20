import { MemorySiteStore } from "./memory";
import { SupabaseSiteStore } from "./supabase";
import type { SiteStore } from "./types";

export { DomainTakenError } from "./types";
export type {
  AiUsageKind,
  GuestUsage,
  GuestUsageFilter,
  LeadRecord,
  NewLead,
  SiteMeta,
  SiteRecord,
  SiteStore,
  VersionRecord,
} from "./types";

let store: SiteStore | undefined;

/**
 * Store usado pelo app:
 * - com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY definidas → Supabase;
 * - sem elas → memória (só para desenvolvimento: os dados somem ao reiniciar).
 * Na produção da Vercel (VERCEL_ENV=production), faltar uma das duas é erro: os sites dos
 * clientes sumiriam a cada reinício. O erro sai na chamada (a rota responde 500) e nada fica em
 * cache, então basta configurar as variáveis e fazer Redeploy.
 */
export function getSiteStore(): SiteStore {
  if (store) return store;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    store = new SupabaseSiteStore({ url, serviceKey });
    return store;
  }
  if (process.env.VERCEL_ENV === "production") {
    console.error(
      "[store] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in production.",
    );
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[store] Supabase is not configured; using the in-memory store. Sites will not persist.",
    );
  }
  store = new MemorySiteStore();
  return store;
}
