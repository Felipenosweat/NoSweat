import type { ApiError } from "@nosweat/schema";
import type { z } from "zod";
import { errorDigest, errorMessage, reportError } from "./notify/alert";

// Helpers das rotas: todo erro sai no formato único { error: { code, message } }.

/** `code`: de preferência um dos ERROR_CODES de @nosweat/schema. */
export function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}

/** Valida a SAÍDA antes de responder: se o back quebrar o contrato, falha aqui e não no front. */
export function jsonResponse<T>(schema: z.ZodType<T>, data: T, status = 200): Response {
  return Response.json(schema.parse(data), { status });
}

/**
 * Tamanho máximo do corpo dos pedidos. Um site inteiro (SiteSpec) tem ~10 KB; o limite evita que
 * alguém grave megabytes por salvamento (cada salvamento vira uma versão no banco).
 */
export const MAX_BODY_BYTES = 100_000;

function tooLarge(): { ok: false; response: Response } {
  return {
    ok: false,
    response: errorResponse(413, "invalid_request", "Request body is too large."),
  };
}

/** Lê e valida o corpo JSON. Em caso de erro, devolve a resposta 400 (ou 413) pronta. */
export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  // Só JSON de verdade: um <form> de outro site não consegue mandar este Content-Type sem
  // passar pelo CORS do navegador (proteção extra contra CSRF, além do cookie SameSite=Lax).
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(contentType.trim())) {
    return {
      ok: false,
      response: errorResponse(415, "invalid_request", "Content-Type must be application/json."),
    };
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return tooLarge();

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return tooLarge();
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "invalid_request", "Request body must be valid JSON."),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    // Só as mensagens, sem o caminho do campo na frente ("email: ..."): todas as mensagens dos
    // schemas são escritas para pessoas e aparecem na tela como vieram. Repetidas saem uma vez.
    const message = [...new Set(result.error.issues.map((issue) => issue.message))].join(" ");
    return { ok: false, response: errorResponse(400, "invalid_request", message) };
  }
  return { ok: true, data: result.data };
}

/**
 * Envolve o handler: qualquer exceção inesperada vira 500 no formato padrão e avisa a equipe
 * (server/notify/alert.ts; só com ALERT_EMAIL configurado). `route` identifica a rota no alerta.
 */
export async function handle(handler: () => Promise<Response>, route = "/api"): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error("[api] unexpected error", error);
    // Nunca lança e responde rápido quando o alerta está desligado ou já saiu há pouco.
    await reportError({ route, digest: errorDigest(error), message: errorMessage(error) });
    return errorResponse(500, "internal_error", "Something went wrong. Please try again.");
  }
}

export function notFound(what = "Site"): Response {
  return errorResponse(404, "not_found", `${what} not found.`);
}

export function unauthorized(): Response {
  return errorResponse(401, "unauthorized", "Please log in to continue.");
}

export function notImplemented(feature: string): Response {
  return errorResponse(501, "not_implemented", `${feature} is not available yet.`);
}
