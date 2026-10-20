import type { Instrumentation } from "next";
import { errorDigest, errorMessage, reportError } from "@/server/notify/alert";

// Gancho do Next para erros do servidor (páginas, Server Actions, rotas e o proxy) que não foram
// tratados. Manda um alerta por e-mail para a equipe (só com ALERT_EMAIL e RESEND_API_KEY; ver
// server/notify/alert.ts). As rotas da API que usam handle() já avisam por conta própria.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportError({
    // Rota do arquivo ("/sites/[id]"), não o endereço com ids: um alerta por tela, não por site.
    route: context.routePath || request.path.split("?")[0] || "unknown",
    method: request.method,
    digest: errorDigest(error),
    message: `${context.routeType} (${context.routerKind}): ${errorMessage(error)}`,
  });
};
