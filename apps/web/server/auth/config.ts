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

/**
 * Só aceita caminhos internos (evita redirecionar para outro site depois do login).
 * Recusa "//x" e "/\\x" (navegadores tratam a barra invertida como "/", virando outro site) e
 * caracteres de controle (tab/quebra de linha somem na URL e podem montar "//").
 */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || value.length > 2000) return fallback;
  if (!value.startsWith("/") || /^\/[/\\]/.test(value)) return fallback;
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || char === "\\") return fallback;
  }
  return value;
}
