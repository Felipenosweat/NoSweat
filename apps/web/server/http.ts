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

/** Lê e valida o corpo JSON. Em caso de erro, devolve a resposta 400 pronta. */
export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
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
