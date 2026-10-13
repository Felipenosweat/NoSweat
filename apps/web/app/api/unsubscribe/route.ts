import { errorResponse } from "@/server/http";
import { getContactStore, isValidUnsubscribeToken } from "@/server/marketing";

// Sair da lista com um clique (RFC 8058): o Gmail/Yahoo mostram "Cancelar inscrição" e fazem
// POST neste endereço (o do cabeçalho List-Unsubscribe). O link do corpo do e-mail leva para a
// página /unsubscribe, que pede confirmação (GET nunca descadastra: robôs abrem links).

function readParams(request: Request): { email: string; token: string } | null {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!email || !token || email.length > 254 || !isValidUnsubscribeToken(email, token)) return null;
  return { email, token };
}

export async function POST(request: Request): Promise<Response> {
  const params = readParams(request);
  if (!params) return errorResponse(400, "invalid_request", "This unsubscribe link is not valid.");
  try {
    await getContactStore().unsubscribe(params.email);
  } catch (error) {
    console.error("[marketing] unsubscribe failed", error);
    return errorResponse(
      500,
      "internal_error",
      "We couldn't update your preferences. Please try again.",
    );
  }
  return Response.json({ unsubscribed: true });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return Response.redirect(new URL(`/unsubscribe${url.search}`, url.origin), 303);
}
