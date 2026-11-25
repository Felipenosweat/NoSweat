import { DomainTakenError, getSiteStore, type SiteRecord } from "../store";
import { revalidatePublicSite } from "../store/revalidate";
import { addDomain, getVercelConfig, removeDomain } from "./vercel";

// Liga um domínio (já conferido) ao site: registra no projeto da Vercel, salva no site e solta o
// domínio anterior. Usado por PUT /api/sites/[id]/domain (depois da prova de dono) e pelo domínio
// grátis do Premium (comprado por nós: não precisa de prova).

/**
 * Liga `domain` a `site`. Lança `DomainTakenError` (outro site já usa) ou `VercelDomainError`.
 * `null` se o site sumiu no meio do caminho.
 */
export async function connectDomainToSite(
  site: SiteRecord,
  domain: string,
): Promise<SiteRecord | null> {
  const store = getSiteStore();
  const other = await store.getByDomain(domain);
  if (other && other.id !== site.id) throw new DomainTakenError(domain);

  const vercel = getVercelConfig();
  const previous = site.customDomain;
  // Liga o novo primeiro; só depois solta o anterior (se algo falhar, o site segue no ar).
  if (vercel) await addDomain(vercel, domain);
  const updated = await store.updateMeta(site.id, { customDomain: domain });
  if (!updated) return null;
  // O domínio novo (talvez com "não encontrado" no cache) e o anterior mudam de site.
  revalidatePublicSite(updated, { customDomain: previous });
  if (vercel && previous && previous !== domain) {
    await removeDomain(vercel, previous).catch((error: unknown) => {
      console.error("[domains] could not release previous domain", previous, error);
    });
  }
  return updated;
}
