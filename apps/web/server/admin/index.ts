import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { DEV_USER, getCurrentUser, type CurrentUser } from "../auth/session";
import { getAuthUser, listAuthUsers, serviceConfig, type AuthUser } from "./auth-api";

// Administradores da plataforma (tabela public.platform_admins) e lista de contas.
// A conta da No Sweat (admin) manda em tudo: vê todas as contas e sites, cria contas de teste,
// vê o painel de qualquer conta (só leitura) e libera planos. As outras contas são subordinadas.
// Usa a chave secreta do Supabase: só roda no servidor.
// TODO: quando houver clientes de verdade, separar o que é privado do cliente
// (ex.: dados de cobrança) do que o admin pode ver.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** `true` quando dá para criar e apagar contas (Supabase configurado com a chave secreta). */
export function canManageAccounts(): boolean {
  return serviceConfig() !== null;
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

/** Ids de todos os admins (para os selos da lista de contas). Erro no banco = lista vazia. */
export const listAdminIds = cache(async (): Promise<Set<string>> => {
  if (!serviceConfig()) {
    return new Set(process.env.DEV_ADMIN === "true" ? [DEV_USER.id] : []);
  }
  try {
    const rows = await supabaseGet("/rest/v1/platform_admins?select=user_id");
    if (!Array.isArray(rows)) return new Set();
    return new Set(
      rows
        .map((row: unknown) =>
          row && typeof row === "object" ? (row as { user_id?: unknown }).user_id : null,
        )
        .filter((id): id is string => typeof id === "string"),
    );
  } catch (error) {
    console.error("[admin] could not list admins", error);
    return new Set();
  }
});

export type ClientAccount = {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  /** user_metadata.first_name / last_name do cadastro (`null` em contas sem perfil). */
  firstName: string | null;
  lastName: string | null;
  /**
   * Conta de teste criada pelo admin: `test_account: true` no user_metadata E no app_metadata.
   * O user_metadata a própria pessoa consegue mudar; o app_metadata só a chave secreta. Exigir os
   * dois impede que uma conta de verdade se marque como teste. Só estas podem ser apagadas pelo
   * painel.
   */
  testAccount: boolean;
};

function metadataText(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toAccount(user: AuthUser): ClientAccount {
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    firstName: metadataText(metadata, "first_name"),
    lastName: metadataText(metadata, "last_name"),
    testAccount: metadata.test_account === true && appMetadata.test_account === true,
  };
}

/** A conta fixa do dev local (sem Supabase). */
function devAccount(): ClientAccount {
  return {
    id: DEV_USER.id,
    email: DEV_USER.email,
    createdAt: null,
    lastSignInAt: null,
    firstName: null,
    lastName: null,
    testAccount: false,
  };
}

/** Nome para mostrar: "Nome Sobrenome", ou `null` se a conta não tiver nome. */
export function accountName(account: Pick<ClientAccount, "firstName" | "lastName">): string | null {
  const name = [account.firstName, account.lastName].filter(Boolean).join(" ");
  return name || null;
}

/** Todas as contas (clientes) cadastradas no Supabase Auth. */
export async function listClients(): Promise<ClientAccount[]> {
  const config = serviceConfig();
  if (!config) return [devAccount()];
  return (await listAuthUsers(config)).map(toAccount);
}

/** Uma conta pelo id (`null` se não existir). `cache`: várias leituras no mesmo request = uma. */
export const getAccount = cache(async (userId: string): Promise<ClientAccount | null> => {
  const config = serviceConfig();
  if (!config) return userId === DEV_USER.id ? devAccount() : null;
  const user = await getAuthUser(config, userId);
  return user ? toAccount(user) : null;
});

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
