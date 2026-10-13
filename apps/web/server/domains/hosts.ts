/** Domínios da própria plataforma: nunca podem ser conectados como domínio de cliente. */
export const APP_DOMAINS = ["nosweatfd.com"];

/** `true` para os endereços da plataforma (inclui localhost e previews da Vercel). */
export function isAppHost(host: string): boolean {
  const bare = host.replace(/^www\./, "");
  return (
    APP_DOMAINS.some((app) => bare === app || bare.endsWith(`.${app}`)) ||
    host === "localhost" ||
    host.endsWith(".vercel.app") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
  );
}

/**
 * Domínios que um cliente nunca pode conectar: os da plataforma e qualquer subdomínio deles
 * (ex.: "login.nosweatfd.com" viraria uma página de cliente com a nossa marca), e os da Vercel.
 */
export function isReservedDomain(domain: string): boolean {
  return [...APP_DOMAINS, "vercel.app", "vercel.com"].some(
    (reserved) => domain === reserved || domain.endsWith(`.${reserved}`),
  );
}
