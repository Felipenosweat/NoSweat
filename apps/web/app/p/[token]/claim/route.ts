import { NextResponse } from "next/server";
import { ensureGuestId } from "@/server/guest";
import { RateLimiter, appOrigin, clientIp } from "@/server/notify";
import { claimPreview } from "@/server/prospects/claim";
import { getActor, type Actor } from "@/server/sites";

// POST /p/<token>/claim: o botão "Make it yours" da prévia. Cria (ou reabre) a cópia do site
// para quem clicou e manda para o editor. É POST de propósito: leitores de e-mail e robôs
// seguem links (GET), e um GET aqui criaria sites sozinho.

// Até 10 cliques por hora por IP (melhor esforço, em memória por instância).
const limiter = new RateLimiter(10, 60 * 60 * 1000);

type Context = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  const { token } = await params;
  // 303: o navegador troca o POST do formulário por um GET na página de destino.
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);

  if (!limiter.take(clientIp(request))) return go("/create");
  try {
    const actor: Actor = (await getActor()) ?? { kind: "guest", guestId: await ensureGuestId() };
    const result = await claimPreview(token, actor, appOrigin(request.url));
    if (result.kind === "not_found") {
      return new NextResponse("This preview is no longer available.", { status: 404 });
    }
    if (result.kind === "limit") return go("/create");
    return go(`/sites/${result.siteId}/edit`);
  } catch (error) {
    console.error("[prospects] claim failed", error);
    // Nada de tela de erro para quem acabou de dizer "quero": segue pelo caminho normal.
    return go("/create");
  }
}
