import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { DEV_USER, getCurrentUser, type CurrentUser } from "./auth/session";
import { normalizeSupabaseUrl } from "./store/supabase";

// Administradores da plataforma (tabela public.platform_admins) e lista de clientes.
// Usa a chave secreta do Supabase: só roda no servidor.
// TODO: quando houver clientes de verdade, separar o que é privado do cliente
// (ex.: dados de cobrança) do que o admin pode ver.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function serviceConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: normalizeSupabaseUrl(url), key } : null;
}

async function supabaseGet(path: string): Promise<unknown> {
  const config = serviceConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const res = await fetch(`${config.url}${path}`, {
    cache: "no-store",
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
  });
  if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/**
 * `true` se o usuário é admin da plataforma. Sem Supabase (dev local), só com DEV_ADMIN=true.
 * `cache` evita consultar o banco várias vezes no mesmo request.
 */
export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  if (!serviceConfig()) return userId === DEV_USER.id && process.env.DEV_ADMIN === "true";
  if (!UUID.test(userId)) return false;
  try {
    const rows = await supabaseGet(`/rest/v1/platform_admins?user_id=eq.${userId}&select=user_id`);
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error("[admin] could not check admin role", error);
    return false;
  }
});

export async function isAdminUser(user: CurrentUser | null): Promise<boolean> {
  return user ? isAdmin(user.id) : false;
}

export type ClientAccount = {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const AuthUsers = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      email: z.string().nullish(),
      created_at: z.string().nullish(),
      last_sign_in_at: z.string().nullish(),
    }),
  ),
});

/** Todas as contas (clientes) cadastradas no Supabase Auth. */
export async function listClients(): Promise<ClientAccount[]> {
  if (!serviceConfig()) {
    return [{ id: DEV_USER.id, email: DEV_USER.email, createdAt: null, lastSignInAt: null }];
  }
  // TODO: paginar quando houver mais de 1000 contas.
  const { users } = AuthUsers.parse(await supabaseGet("/auth/v1/admin/users?per_page=1000"));
  return users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    createdAt: u.created_at ?? null,
    lastSignInAt: u.last_sign_in_at ?? null,
  }));
}

/**
 * Garante que quem está vendo é admin; senão manda para o login ou responde 404.
 * Cada página do /admin chama isto: o layout sozinho não basta, porque o Next pode buscar
 * só a página (navegação no cliente) sem rodar o layout de novo.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdminUser(user))) notFound();
  return user;
}
