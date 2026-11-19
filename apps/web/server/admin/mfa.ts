import { cache } from "react";
import { getSupabaseAuthConfig } from "../auth/config";
import { getSessionClaims } from "../auth/session";

// Verificação em duas etapas (TOTP do Supabase Auth) para admins. Admin só passa com a sessão em
// AAL2 (senha + código do aplicativo autenticador). A claim `aal` vem do JWT da sessão, validado
// pelo Supabase em getSessionClaims (getClaims confere a assinatura): não dá para forjar no cookie.
// Sem Supabase (dev local, DEV_USER) não existe MFA e nada muda.
// ADMIN_REQUIRE_MFA=false desliga a exigência (só para recuperar o acesso: ver DEPLOY.md).

export type Aal = "aal1" | "aal2";

/** A exigência vale? Padrão: sim, quando o Supabase Auth está configurado. */
export function adminMfaRequired(
  env: Record<string, string | undefined> = process.env,
  supabaseConfigured: boolean = getSupabaseAuthConfig() !== null,
): boolean {
  if (!supabaseConfigured) return false;
  const flag = env.ADMIN_REQUIRE_MFA?.trim().toLowerCase();
  return !(flag === "false" || flag === "0" || flag === "off" || flag === "no");
}

/** Nível da sessão pelas claims do JWT (`null` sem sessão). */
export function aalFromClaims(claims: Record<string, unknown> | null): Aal | null {
  if (!claims) return null;
  return claims.aal === "aal2" ? "aal2" : "aal1";
}

/** Nível da sessão do request atual. */
export const currentAal = cache(async (): Promise<Aal | null> => {
  return aalFromClaims(await getSessionClaims());
});

/**
 * A sessão atual pode usar os poderes de admin? (MFA desligado/sem Supabase, ou sessão AAL2.)
 * Não confere se é admin: quem chama já conferiu.
 */
export async function adminMfaSatisfied(): Promise<boolean> {
  if (!adminMfaRequired()) return true;
  return (await currentAal()) === "aal2";
}

/** Código de 6 dígitos do aplicativo autenticador (espaços são ignorados). */
export function normalizeTotpCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.replace(/\s+/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
