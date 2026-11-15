// Robôs e pré-visualizadores de link conhecidos, pelo User-Agent. Usado onde a gente conta
// "alguém abriu" (visitas dos sites, aberturas da prévia dos prospects): robô não é gente.
// Sem User-Agent também conta como robô. É melhor esforço: robô que se disfarça de navegador passa.

const BOT_UA =
  /bot|crawl|spider|preview|scan|monitor|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http|facebookexternalhit|whatsapp|slack|telegram|discord|skype|outlook|proofpoint|mimecast|barracuda/i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}
