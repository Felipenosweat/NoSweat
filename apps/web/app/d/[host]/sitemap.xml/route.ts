import { customDomainUrl } from "@/components/site-metadata";
import { ownerHasLiveAccess } from "@/server/billing";
import { getSiteStore } from "@/server/store";

// sitemap.xml no domínio do cliente (o proxy.ts reescreve joes.com/sitemap.xml para cá). O site
// do cliente é uma página só: um endereço, com a data da última publicação para o Google saber
// quando voltar. Site fora do ar (rascunho, apagado, plano vencido) = 404.

type Context = { params: Promise<{ host: string }> };

const escapeXml = (text: string) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(_request: Request, { params }: Context): Promise<Response> {
  const { host } = await params;
  let domain: string;
  try {
    domain = decodeURIComponent(host)
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const site = await getSiteStore().getByDomain(domain);
  if (!site || site.status !== "published" || !(await ownerHasLiveAccess(site.ownerId))) {
    return new Response("Not found", { status: 404 });
  }
  const lastmod = site.updatedAt.slice(0, 10);
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `<url><loc>${escapeXml(customDomainUrl(site.customDomain ?? domain))}/</loc>` +
    (lastmod ? `<lastmod>${lastmod}</lastmod>` : "") +
    "</url></urlset>\n";
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
