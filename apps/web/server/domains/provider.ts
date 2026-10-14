import * as dns from "node:dns/promises";
import type { DnsProvider } from "@nosweat/schema";

// Descobre onde o cliente mexe no DNS do domínio olhando os nameservers (NS). Assim a tela de
// domínio já abre no passo a passo certo (GoDaddy, Namecheap...) sem perguntar nada.

const PATTERNS: [RegExp, DnsProvider][] = [
  [/\.domaincontrol\.com$/, "godaddy"],
  [/\.registrar-servers\.com$/, "namecheap"],
  [/\.ns\.cloudflare\.com$/, "cloudflare"],
  [/\.(squarespacedns|googledomains)\.com$/, "squarespace"],
  [/\.dns-parking\.com$|hostinger/, "hostinger"],
  [/\.porkbun\.com$/, "porkbun"],
  [/\.ui-dns\.(com|org|de|biz)$/, "ionos"],
  [/\.wixdns\.net$/, "wix"],
];

/** Empresa pelo nome de um nameserver (ex.: "ns51.domaincontrol.com" → "godaddy"). */
export function providerFromNameserver(nameserver: string): DnsProvider | null {
  const host = nameserver.toLowerCase().replace(/\.$/, "");
  return PATTERNS.find(([pattern]) => pattern.test(host))?.[1] ?? null;
}

/** Empresa do DNS de `domain`, ou `null` se não reconhecer (ou o DNS demorar). */
export async function detectDnsProvider(
  domain: string,
  timeoutMs = 2500,
): Promise<DnsProvider | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const lookup = dns.resolveNs(domain);
    lookup.catch(() => undefined);
    // Nunca deixa a tela esperando um DNS lento.
    const timeout = new Promise<string[]>((resolve) => {
      timer = setTimeout(() => resolve([]), timeoutMs);
    });
    const nameservers = await Promise.race([lookup, timeout]);
    for (const ns of nameservers) {
      const provider = providerFromNameserver(ns);
      if (provider) return provider;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
