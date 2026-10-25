import { isAdminUser } from "../admin";
import { getCurrentUser, type CurrentUser } from "../auth/session";
import { errorResponse, notFound, unauthorized } from "../http";
import { ModelStudioError } from "./index";

// Helpers das rotas /api/admin/models/*. Nas rotas não dá para usar requireAdmin() (ele
// redireciona/404 de página): aqui a resposta é o JSON de erro padrão.

/** Admin logado, ou a resposta de erro (401 sem login; 404 para quem não é admin). */
export async function requireAdminApi(): Promise<
  { ok: true; user: CurrentUser } | { ok: false; response: Response }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: unauthorized() };
  // Quem não é admin não fica sabendo que a rota existe.
  if (!(await isAdminUser(user))) return { ok: false, response: notFound("Page") };
  return { ok: true, user };
}

/** ModelStudioError → resposta no formato padrão; outro erro sobe (o `handle` vira 500). */
export function studioErrorResponse(error: unknown): Response {
  if (!(error instanceof ModelStudioError)) throw error;
  const status = error.code === "not_found" ? 404 : error.code === "conflict" ? 409 : 400;
  return errorResponse(status, error.code, error.message);
}
