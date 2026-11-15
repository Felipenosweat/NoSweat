import { RateLimiter, clientIp } from "@/server/notify";
import { isLikelyBot } from "@/server/bots";
import { getVisitStore } from "@/server/visits/store";

// POST /api/public/sites/<id>/visit: o site publicado avisa "alguém abriu" (components/VisitBeacon).
// Público e sem sessão. Só soma 1 na contagem do dia: nada do visitante é guardado (nem IP, nem
// cookie). Robôs conhecidos não contam e cada IP conta no máximo 20 vezes por hora por site
// (melhor esforço, em memória por instância). Sempre responde 204: a página não depende disto.

const limiter = new RateLimiter(20, 60 * 60 * 1000);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  const done = new Response(null, { status: 204 });
  if (!UUID.test(id) || isLikelyBot(request.headers.get("user-agent"))) return done;
  if (!limiter.take(`${clientIp(request)}|${id}`)) return done;
  try {
    await getVisitStore().count(id);
  } catch (error) {
    console.error("[visits] could not count the visit", error);
  }
  return done;
}
