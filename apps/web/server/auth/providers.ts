import { getSupabaseAuthConfig } from "./config";

export type EnabledProviders = { google: boolean; apple: boolean };

const NONE: EnabledProviders = { google: false, apple: false };

/** Provedores de login social aceitos pelas Server Actions (lista fechada). */
export const OAUTH_PROVIDERS = ["google", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return typeof value === "string" && (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Quais logins sociais estão ligados no Supabase (Authentication → Providers).
 * Lê `/auth/v1/settings` (público, só precisa da chave publishable) com cache de 5 minutos.
 * Qualquer erro, ou Supabase não configurado, = tudo desligado (os botões simplesmente somem).
 */
export async function getEnabledProviders(): Promise<EnabledProviders> {
  const config = getSupabaseAuthConfig();
  if (!config) return NONE;
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.publishableKey },
      next: { revalidate: 300 },
    });
    if (!response.ok) return NONE;
    const body: unknown = await response.json();
    const external =
      typeof body === "object" && body !== null && "external" in body ? body.external : null;
    if (typeof external !== "object" || external === null) return NONE;
    const flags = external as Record<string, unknown>;
    return { google: flags.google === true, apple: flags.apple === true };
  } catch (error) {
    console.error("Could not read Supabase auth settings", error);
    return NONE;
  }
}
