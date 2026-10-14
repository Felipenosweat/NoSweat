import type { DnsRecord, DomainResponse } from "@nosweat/schema";
import type { SiteRecord } from "../store";
import { detectDnsProvider } from "./provider";
import { getVercelConfig, isDomainConfigured } from "./vercel";

export { detectDnsProvider } from "./provider";
export { addDomain, getVercelConfig, removeDomain, VercelDomainError } from "./vercel";

/** Registros que o cliente cria no painel onde comprou o domínio (Hostinger, GoDaddy, etc.). */
export const DNS_RECORDS: DnsRecord[] = [
  { type: "A", name: "@", value: "76.76.21.21" },
  { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
];

export { APP_DOMAINS, isAppHost, isReservedDomain } from "./hosts";

/** Estado do domínio de um site, já com os registros de DNS para mostrar ao cliente. */
export async function getDomainState(site: SiteRecord): Promise<DomainResponse> {
  const domain = site.customDomain;
  if (!domain) return { siteId: site.id, domain: null, status: null, records: DNS_RECORDS };

  const vercel = getVercelConfig();
  if (!vercel) {
    const dnsProvider = await detectDnsProvider(domain);
    return { siteId: site.id, domain, status: "manual", records: DNS_RECORDS, dnsProvider };
  }

  const configured = await isDomainConfigured(vercel, domain).catch(() => false);
  return {
    siteId: site.id,
    domain,
    status: configured ? "active" : "pending",
    records: DNS_RECORDS,
    // Só quem ainda vai mexer no DNS precisa do passo a passo.
    dnsProvider: configured ? null : await detectDnsProvider(domain),
  };
}

/** "Joe's Plumbing" + id → "joes-plumbing-6f1c2a" (único por causa do pedaço do id). */
export function makeSlug(name: string, id: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "site";
  return `${base}-${id.replace(/-/g, "").slice(0, 6).toLowerCase()}`;
}
