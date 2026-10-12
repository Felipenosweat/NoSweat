import { MemorySiteStore } from "./memory";
import type { SiteStore } from "./types";

export type { SiteRecord, SiteStore } from "./types";

let store: SiteStore | undefined;

/** Store usado pelo app. TODO(back): usar createSupabaseSiteStore() quando o Supabase estiver configurado. */
export function getSiteStore(): SiteStore {
  store ??= new MemorySiteStore();
  return store;
}
