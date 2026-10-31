import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Chamadas à API de administração do Supabase Auth (GoTrue), com a chave secreta (service role).
// Só roda no servidor. Formato das respostas (GoTrue):
// - GET    /auth/v1/admin/users?per_page=N → { users: [usuário, ...], aud }
// - GET    /auth/v1/admin/users/{id}      → usuário (404 se não existir)
// - POST   /auth/v1/admin/users           → usuário criado
// - PUT    /auth/v1/admin/users/{id}      → usuário alterado (app_metadata é mesclado; chave com
//                                           valor null é apagada)
// - DELETE /auth/v1/admin/users/{id}      → {} (as tabelas com "on delete cascade" vão junto)
// Erros: { code, error_code, msg } (versões antigas: { code, msg } ou { error, error_description }).

export type ServiceConfig = { url: string; key: string };

/** URL do projeto + chave secreta, ou `null` sem Supabase (dev local). */
export function serviceConfig(): ServiceConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: normalizeSupabaseUrl(url), key } : null;
}

export const AuthUser = z.object({
  id: z.string(),
  email: z.string().nullish(),
  created_at: z.string().nullish(),
  last_sign_in_at: z.string().nullish(),
  /** Login desligado até esta data (ban do admin). */
  banned_until: z.string().nullish(),
  user_metadata: z.record(z.string(), z.unknown()).nullish(),
  app_metadata: z.record(z.string(), z.unknown()).nullish(),
});
export type AuthUser = z.infer<typeof AuthUser>;

const AuthUserList = z.object({ users: z.array(AuthUser) });

const AuthErrorBody = z.object({
  msg: z.string().optional(),
  message: z.string().optional(),
  error_code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

/** Erro da API do Supabase Auth, com o status HTTP e o `error_code` (se veio). */
export class AuthAdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "AuthAdminError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function call(
  config: ServiceConfig,
  path: string,
  init: { method?: string; body?: unknown },
  fetchImpl: typeof fetch,
): Promise<unknown> {
  return (await callWithHeaders(config, path, init, fetchImpl)).json;
}

/** Como `call`, mas devolve também os cabeçalhos (a lista de contas traz o total neles). */
async function callWithHeaders(
  config: ServiceConfig,
  path: string,
  init: { method?: string; body?: unknown },
  fetchImpl: typeof fetch,
): Promise<{ json: unknown; headers: Headers }> {
  const res = await fetchImpl(`${config.url}/auth/v1${path}`, {
    method: init.method ?? "GET",
    cache: "no-store",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const parsed = AuthErrorBody.safeParse(json);
    const body: z.infer<typeof AuthErrorBody> = parsed.success ? parsed.data : {};
    const message =
      body.msg ?? body.message ?? body.error_description ?? body.error ?? text.slice(0, 200);
    throw new AuthAdminError(
      `Supabase Auth request failed (${res.status}): ${message}`,
      res.status,
      body.error_code ?? null,
    );
  }
  return { json, headers: res.headers };
}

/** Contas por página na listagem (o máximo que o painel pede de uma vez). */
export const AUTH_USERS_PER_PAGE = 1000;
/** Teto de páginas (50 mil contas), para nunca ficar em laço se a API responder estranho. */
const MAX_USER_PAGES = 50;

/**
 * Todas as contas, em páginas de 1000 (normalmente uma chamada só). Para quando já leu o total
 * do cabeçalho `X-Total-Count` ou quando uma página vem incompleta.
 */
export async function listAuthUsers(
  config: ServiceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthUser[]> {
  const users: AuthUser[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    const { json, headers } = await callWithHeaders(
      config,
      `/admin/users?page=${page}&per_page=${AUTH_USERS_PER_PAGE}`,
      {},
      fetchImpl,
    );
    const batch = AuthUserList.parse(json).users;
    users.push(...batch);
    const totalHeader = headers.get("x-total-count");
    const total = totalHeader === null ? Number.NaN : Number(totalHeader);
    if (batch.length === 0) break;
    if (Number.isFinite(total)) {
      if (users.length >= total) break;
    } else if (batch.length < AUTH_USERS_PER_PAGE) {
      break;
    }
  }
  return users;
}

/** Uma conta pelo id, ou `null` se não existir. */
export async function getAuthUser(
  config: ServiceConfig,
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthUser | null> {
  if (!UUID.test(id)) return null;
  try {
    return AuthUser.parse(await call(config, `/admin/users/${id}`, {}, fetchImpl));
  } catch (error) {
    if (error instanceof AuthAdminError && error.status === 404) return null;
    throw error;
  }
}

export type NewAuthUser = {
  email: string;
  password: string;
  /** Dados do perfil (a própria pessoa pode mudar depois). */
  userMetadata: Record<string, unknown>;
  /** Dados que só o servidor (chave secreta) pode mudar. */
  appMetadata: Record<string, unknown>;
};

/**
 * Cria a conta já com o e-mail confirmado (`email_confirm: true`: o Supabase não manda e-mail
 * de confirmação). Lança AuthAdminError (ex.: `email_exists`, status 422) se não der.
 */
export async function createAuthUser(
  config: ServiceConfig,
  input: NewAuthUser,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthUser> {
  const json = await call(
    config,
    "/admin/users",
    {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: input.userMetadata,
        app_metadata: input.appMetadata,
      },
    },
    fetchImpl,
  );
  return AuthUser.parse(json);
}

/** Apaga a conta de vez (sem "soft delete"). Conta que já não existe conta como apagada. */
export async function deleteAuthUser(
  config: ServiceConfig,
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!UUID.test(id)) throw new Error(`Invalid user id: ${id}`);
  try {
    await call(
      config,
      `/admin/users/${id}`,
      { method: "DELETE", body: { should_soft_delete: false } },
      fetchImpl,
    );
  } catch (error) {
    if (error instanceof AuthAdminError && error.status === 404) return;
    throw error;
  }
}

/**
 * Mescla `patch` no app_metadata da conta (só o servidor, com a chave secreta, pode mudar).
 * Chave com valor `null` é apagada pelo Supabase. Lança AuthAdminError se não der.
 */
export async function updateAuthUserAppMetadata(
  config: ServiceConfig,
  id: string,
  patch: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!UUID.test(id)) throw new Error(`Invalid user id: ${id}`);
  await call(
    config,
    `/admin/users/${id}`,
    { method: "PUT", body: { app_metadata: patch } },
    fetchImpl,
  );
}

/** Duração do ban do Supabase Auth para "desligar o login" (100 anos; "none" religa). */
export const LOGIN_DISABLED_DURATION = "876000h";

/**
 * Desliga (`disabled = true`) ou religa o login da conta pelo ban do Supabase Auth
 * (`ban_duration`). Não apaga nada. Quem já está logado continua até o token de acesso vencer
 * (até 1 hora); renovar a sessão e entrar de novo são recusados na hora.
 */
export async function setAuthUserLoginDisabled(
  config: ServiceConfig,
  id: string,
  disabled: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!UUID.test(id)) throw new Error(`Invalid user id: ${id}`);
  await call(
    config,
    `/admin/users/${id}`,
    { method: "PUT", body: { ban_duration: disabled ? LOGIN_DISABLED_DURATION : "none" } },
    fetchImpl,
  );
}
