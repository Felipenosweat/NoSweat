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
 */
export function getSiteStore(): SiteStore {
  if (store) return store;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    store = new SupabaseSiteStore({ url, serviceKey });
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[store] Supabase is not configured; using the in-memory store. Sites will not persist.",
      );
    }
    store = new MemorySiteStore();
  }
  return store;
}
