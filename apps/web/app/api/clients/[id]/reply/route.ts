import { ClientReplyRequest, ClientReplyResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { replyToClient } from "@/server/clients/reply";
import { errorResponse, handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { RateLimiter } from "@/server/notify";

type Context = { params: Promise<{ id: string }> };

// Anti-abuso (melhor esforço, em memória por instância): no máximo 30 respostas por hora por
// conta. Folga de sobra para o dia a dia de um dono e freio para um laço que dispararia e-mails.
const limiter = new RateLimiter(30, 60 * 60 * 1000);

/**
 * POST /api/clients/[id]/reply { channel, mode?, subject?, message, confirmation?, moveToContacted? }:
 * responde ao cliente. E-mail em `mode: "send"` (padrão) sai pela Resend, com `reply_to` no e-mail
 * do dono; sem RESEND_API_KEY → 503 `email_not_configured` (a tela abre o app de e-mail do dono).
 * `mode: "log"` só registra no histórico o que o dono mandou por conta própria (SMS ou e-mail do
 * celular). Cliente de outra pessoa = 404. No modo "ver como" do admin o proxy recusa (403).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const input = await readJson(request, ClientReplyRequest);
    if (!input.ok) return input.response;
    if (!limiter.take(user.id)) {
      return errorResponse(429, "quota_exceeded", "Too many messages. Please try again later.");
    }

    const outcome = await replyToClient(user.id, id, input.data);
    if (outcome.ok) return jsonResponse(ClientReplyResponse, outcome.data, 201);
    switch (outcome.reason) {
      case "not_found":
        return notFound("Client");
      case "no_contact":
        return errorResponse(
          400,
          "invalid_request",
          input.data.channel === "email"
            ? "This client has no email address. Add one first."
            : "This client has no phone number. Add one first.",
        );
      case "no_reply_to":
        return errorResponse(
          400,
          "invalid_request",
          "Add your business email in Settings so your client's answer reaches you.",
        );
      case "not_configured":
        return errorResponse(
          503,
          "email_not_configured",
          "Sending email from No Sweat isn't set up yet. You can open your own email app instead.",
        );
      case "send_failed":
        return errorResponse(
          502,
          "internal_error",
          "We couldn't send the email. Please try again in a moment.",
        );
    }
  }, "/api/clients/[id]/reply");
}
