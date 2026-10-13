import type { ApiError } from "@nosweat/schema";
import type { z } from "zod";

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
    const message = result.error.issues
      .map((issue) =>
        issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
      )
      .join("; ");
    return { ok: false, response: errorResponse(400, "invalid_request", message) };
  }
  return { ok: true, data: result.data };
}

/** Envolve o handler: qualquer exceção inesperada vira 500 no formato padrão. */
export async function handle(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error("[api] unexpected error", error);
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
