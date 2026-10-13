/** Domínios da própria plataforma: nunca podem ser conectados como domínio de cliente. */
export const APP_DOMAINS = ["nosweatfd.com"];

/** `true` para os endereços da plataforma (inclui localhost e previews da Vercel). */
export function isAppHost(host: string): boolean {
  const bare = host.replace(/^www\./, "");
  return (
    APP_DOMAINS.includes(bare) ||
    host === "localhost" ||
    host.endsWith(".vercel.app") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
  );
}
