import type { SiteStore } from "./types";

// TODO(back): implementar SiteStore com Supabase (tabela `sites`: id, spec jsonb, status, created_at,
// updated_at), usando NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Validar `spec` com
// SiteSpec.parse ao ler do banco.
export function createSupabaseSiteStore(): SiteStore {
  throw new Error("Supabase store is not implemented yet.");
}
