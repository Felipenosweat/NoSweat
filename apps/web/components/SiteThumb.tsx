import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import { SiteThumbFrame } from "./SiteThumbFrame";

/** Tipos de seção que o topo do site lê de outras partes (faixa de serviços, preço, botão). */
const KEEP_FOR_HEADER = new Set<SiteSpec["sections"][number]["type"]>(["services", "contact"]);

/**
 * Versão leve do SiteSpec para a miniatura: a janela 16:10 só mostra o cabeçalho e o topo, então
 * ficam as seções até a principal (`hero`) e mais uma (folga para um topo curto), mais as que o
 * topo consulta (serviços e contato: faixa de serviços, "From $X" e o destino do botão). O resto
 * (galeria, FAQ, depoimentos...) não aparece na miniatura e só pesava no HTML e no RSC do painel.
 * Não passa pelo Zod de novo (pode ter menos de 2 seções): só serve para desenhar.
 */
export function thumbnailSpec(spec: SiteSpec): SiteSpec {
  const heroIndex = spec.sections.findIndex((section) => section.type === "hero");
  const lastAboveFold = (heroIndex === -1 ? 0 : heroIndex) + 1;
  const sections = spec.sections.filter(
    (section, index) => index <= lastAboveFold || KEEP_FOR_HEADER.has(section.type),
  );
  return sections.length === spec.sections.length ? spec : { ...spec, sections };
}

/**
 * Miniatura de um site: o próprio site desenhado no servidor e reduzido (só o topo, ver
 * `thumbnailSpec`). Decorativa (aria-hidden + inert): o nome e os links do card dizem o que é.
 * Quem chama passa `liveSpec(site)` (o que está no ar; o rascunho se nunca publicou).
 */
export function SiteThumb({ spec }: { spec: SiteSpec }) {
  return (
    <SiteThumbFrame>
      <SiteRenderer spec={thumbnailSpec(spec)} anchors={false} />
    </SiteThumbFrame>
  );
}
