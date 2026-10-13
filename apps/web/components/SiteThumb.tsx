import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import { SiteThumbFrame } from "./SiteThumbFrame";

/**
 * Miniatura de um site: o próprio site desenhado no servidor e reduzido.
 * Decorativa (aria-hidden + inert): o nome e os links do card dizem o que é.
 * Quem chama passa `liveSpec(site)` (o que está no ar; o rascunho se nunca publicou).
 */
export function SiteThumb({ spec }: { spec: SiteSpec }) {
  return (
    <SiteThumbFrame>
      <SiteRenderer spec={spec} />
    </SiteThumbFrame>
  );
}
