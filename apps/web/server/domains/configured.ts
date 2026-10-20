import { unstable_cache } from "next/cache";
import { getVercelConfig, isDomainConfigured } from "./vercel";

// "O domínio do cliente já funciona?" para páginas públicas (ex.: o canonical do endereço
// grátis /s/<slug>). Pergunta à Vercel no máximo uma vez por hora por domínio: as páginas
// públicas são muito abertas e a API da Vercel tem limite de uso.

const ONE_HOUR_S = 60 * 60;

const cachedIsConfigured = unstable_cache(
  async (domain: string): Promise<boolean> => {
    const vercel = getVercelConfig();
    if (!vercel) return false;
    // Erro da Vercel sobe (e não fica guardado no cache); quem chama trata como "não".
    return isDomainConfigured(vercel, domain);
  },
  ["domain-live"],
  { revalidate: ONE_HOUR_S },
);

/**
 * `true` quando o DNS do domínio do cliente já aponta para nós (site abrindo nele com HTTPS).
 * Sem VERCEL_TOKEN não dá para saber: `false` (fica tudo no endereço grátis). Nunca lança.
 */
export async function isDomainLive(domain: string): Promise<boolean> {
  if (!getVercelConfig()) return false;
  try {
    return await cachedIsConfigured(domain.toLowerCase());
  } catch (error) {
    console.error("[domains] could not check if the domain is live", domain, error);
    return false;
  }
}
