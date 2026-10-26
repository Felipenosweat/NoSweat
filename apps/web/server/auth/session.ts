import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabaseAuthConfig } from "./config";

export type CurrentUser = { id: string; email: string | null };

/** Usuário fixo quando o login está desligado (dev local sem Supabase). */
export const DEV_USER: CurrentUser = { id: "local-dev", email: "dev@localhost" };

/** Cliente Supabase para Server Components, Server Actions e Route Handlers. `null` sem configuração. */
export async function createSupabaseServerClient() {
  const config = getSupabaseAuthConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component, que não pode gravar cookies.
          // Tudo bem: o proxy.ts renova a sessão a cada request.
        }
      },
    },
  });
}

/**
 * Claims do JWT da sessão (validadas pelo Supabase), lidas uma vez por request: `getCurrentUser`
 * e quem precisa do `user_metadata` (ex.: o primeiro nome da saudação) dividem a mesma leitura.
 * `null` sem Supabase configurado ou sem sessão.
 */
export const getSessionClaims = cache(async (): Promise<Record<string, unknown> | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  return (data?.claims as Record<string, unknown> | undefined) ?? null;
});

/**
 * Usuário logado (validado pelo Supabase), DEV_USER sem Supabase, ou `null` se não estiver logado.
 * `cache()` do React: dentro de um mesmo request (layout + página + seções) a sessão é lida uma vez só.
 * Fora de um request do React (testes, scripts) o cache não guarda nada e cada chamada lê de novo.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!getSupabaseAuthConfig()) return DEV_USER;
  const claims = await getSessionClaims();
  const sub = claims?.sub;
  if (typeof sub !== "string" || !sub) return null;
  const email = claims?.email;
  return { id: sub, email: typeof email === "string" ? email : null };
});
