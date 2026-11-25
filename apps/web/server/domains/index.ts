import type { DnsRecord, DomainResponse } from "@nosweat/schema";
import type { SiteRecord } from "../store";
import { isOwnFreeDomain } from "./free-domain-access";
import { detectDnsProvider } from "./provider";
import { getVercelConfig, isDomainConfigured } from "./vercel";

export { connectDomainToSite } from "./connect";
export { detectDnsProvider } from "./provider";
export { addDomain, getVercelConfig, removeDomain, VercelDomainError } from "./vercel";

/** Registros que o cliente cria no painel onde comprou o domínio (Hostinger, GoDaddy, etc.). */
export const DNS_RECORDS: DnsRecord[] = [
  { type: "A", name: "@", value: "76.76.21.21" },
  { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
];

export { APP_DOMAINS, isAppHost, isReservedDomain } from "./hosts";
// A regra do endereço grátis mora em lib/slug.ts (o editor também usa, no navegador).
export { makeSlug } from "@/lib/slug";

/** Estado do domínio de um site, já com os registros de DNS para mostrar ao cliente. */
export async function getDomainState(site: SiteRecord): Promise<DomainResponse> {
  const domain = site.customDomain;
  if (!domain) return { siteId: site.id, domain: null, status: null, records: DNS_RECORDS };

  const vercel = getVercelConfig();
  // Domínio grátis do Premium (comprado por nós na Vercel): o DNS já é nosso, nada a criar.
  if (await isOwnFreeDomain(site.ownerId, domain)) {
    const configured = vercel ? await isDomainConfigured(vercel, domain).catch(() => false) : false;
    return {
      siteId: site.id,
      domain,
      status: !vercel ? "manual" : configured ? "active" : "pending",
      records: [],
      dnsProvider: null,
      managed: true,
    };
  }
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
