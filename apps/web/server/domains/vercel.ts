// Liga os domínios dos clientes ao projeto da No Sweat na Vercel (API REST, sem SDK).
// Precisa de VERCEL_TOKEN (segredo, só nas variáveis da Vercel). O id do projeto e do time não
// são segredos; têm padrão aqui e podem ser trocados por VERCEL_PROJECT_ID / VERCEL_TEAM_ID.

const API = "https://api.vercel.com";
const DEFAULT_PROJECT_ID = "prj_YumaXn703wgi6EEqSNhyJG0RGJbr";
const DEFAULT_TEAM_ID = "team_PIHSACImdAMrcGeTM7Ipjs5k";

export type VercelConfig = { token: string; projectId: string; teamId: string };

export function getVercelConfig(): VercelConfig | null {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;
  return {
    token,
    projectId: process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID || DEFAULT_TEAM_ID,
  };
}

export class VercelDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

type VercelErrorBody = { error?: { code?: string; message?: string } };

async function call(
  config: VercelConfig,
  method: string,
  path: string,
  body?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; json: unknown }> {
  const url = new URL(path, API);
  url.searchParams.set("teamId", config.teamId);
  const res = await fetchImpl(url, {
    method,
    cache: "no-store",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => null);
  return { status: res.status, json };
}

function errorOf(json: unknown): { code: string; message: string } {
  const error = (json as VercelErrorBody | null)?.error;
  return { code: error?.code ?? "unknown", message: error?.message ?? "Vercel API error" };
}

/** Adiciona `domain` e `www.domain` (redirecionando para o domínio raiz) ao projeto. */
export async function addDomain(
  config: VercelConfig,
  domain: string,
  fetchImpl?: typeof fetch,
): Promise<void> {
  const path = `/v10/projects/${config.projectId}/domains`;
  for (const body of [{ name: domain }, { name: `www.${domain}`, redirect: domain }]) {
    const { status, json } = await call(config, "POST", path, body, fetchImpl);
    if (status < 300) continue;
    const { code, message } = errorOf(json);
    // Já está neste projeto: tudo certo (ex.: o cliente clicou duas vezes).
    if (code === "domain_already_in_use_by_project" || code === "domain_already_exists") continue;
    throw new VercelDomainError(message, code);
  }
}

/** Remove `domain` e `www.domain` do projeto. Ignora "não encontrado". */
export async function removeDomain(
  config: VercelConfig,
  domain: string,
  fetchImpl?: typeof fetch,
): Promise<void> {
  for (const name of [`www.${domain}`, domain]) {
    const { status, json } = await call(
      config,
      "DELETE",
      `/v9/projects/${config.projectId}/domains/${name}`,
      undefined,
      fetchImpl,
    );
    if (status < 300 || status === 404) continue;
    const { code, message } = errorOf(json);
    throw new VercelDomainError(message, code);
  }
}

/** `true` quando o DNS do cliente já aponta para a Vercel (aí o HTTPS sai sozinho). */
export async function isDomainConfigured(
  config: VercelConfig,
  domain: string,
  fetchImpl?: typeof fetch,
): Promise<boolean> {
  const { status, json } = await call(
    config,
    "GET",
    `/v6/domains/${domain}/config`,
    undefined,
    fetchImpl,
  );
  if (status >= 300) return false;
  return (json as { misconfigured?: boolean } | null)?.misconfigured === false;
}
