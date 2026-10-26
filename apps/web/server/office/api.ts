import type { z } from "zod";
import { getCurrentUser, type CurrentUser } from "../auth/session";
import { errorResponse, handle, unauthorized } from "../http";
import { OfficeError } from "./types";

// Moldura das rotas do escritório: erro inesperado vira 500 (handle), `OfficeError` vira a
// resposta padrão `{ error: { code, message } }` com o status da regra.

/** Rota pública (link do orçamento/fatura): sem conta. */
export async function officeHandle(
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  return handle(async () => {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof OfficeError) {
        return errorResponse(error.status, error.code, error.message);
      }
      throw error;
    }
  }, route);
}

/** Rota do dono: exige conta (401 sem login); tudo é do `user.id`. */
export async function ownerRoute(
  route: string,
  handler: (user: CurrentUser) => Promise<Response>,
): Promise<Response> {
  return officeHandle(route, async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return handler(user);
  });
}

/** Parâmetro de busca opcional validado pelo schema (inválido → 400). */
export function queryParam<T>(
  params: URLSearchParams,
  name: string,
  schema: z.ZodType<T>,
): T | undefined {
  const raw = params.get(name);
  if (!raw) return undefined;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new OfficeError(400, "invalid_request", `Invalid ${name}.`);
  return parsed.data;
}
