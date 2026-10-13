import { normalizeSupabaseUrl } from "../store/supabase";

export type SupabaseAuthConfig = { url: string; publishableKey: string };

/**
 * Configuração do Supabase Auth, ou `null` quando não está configurado.
 * Sem configuração (dev local sem chaves), o login fica desligado e todo mundo é o DEV_USER.
 * A chave publishable é pública por definição (vai para o navegador); a secret nunca entra aqui.
 */
export function getSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url: normalizeSupabaseUrl(url), publishableKey };
}

/** Só aceita caminhos internos (evita redirecionar para outro site depois do login). */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
