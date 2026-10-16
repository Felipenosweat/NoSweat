// Endereço público oficial do nosweatfd.com para buscadores (canonical, sitemap, robots, JSON-LD).
// Com "www": na Vercel, nosweatfd.com redireciona (308) para www.nosweatfd.com, e o Google pede
// que o endereço oficial seja o final, não um que redireciona.
// Links de e-mail continuam em NEXT_PUBLIC_SITE_URL (redirecionar ali não faz mal).
export const SITE_ORIGIN = "https://www.nosweatfd.com";

/** Endereço completo de um caminho do site, ex.: siteUrl("/pricing"). */
export function siteUrl(path = "/"): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}
