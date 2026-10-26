import type { ReactNode } from "react";
import { SiteThumbScale } from "./SiteThumbScale";

/** Tamanho "real" da janela desenhada na miniatura (desktop, proporção 16:10). */
export const THUMB_WIDTH = 1280;
export const THUMB_HEIGHT = 800;

/**
 * Caixa 16:10 que reduz o conteúdo (renderizado no servidor) até caber na largura do card.
 * Componente do SERVIDOR: o site desenhado não passa por um componente de cliente (nada de
 * hidratar a árvore inteira como `children`). Só o `<SiteThumbScale />`, um elemento vazio, roda
 * no navegador: mede a largura e grava a escala na variável `--thumb-scale` da caixa. Antes disso
 * (e sem JavaScript) vale a escala aproximada de um card comum.
 */
export function SiteThumbFrame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none relative aspect-[16/10] w-full overflow-hidden bg-slate-100 select-none"
    >
      <SiteThumbScale width={THUMB_WIDTH} />
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{
          width: THUMB_WIDTH,
          height: THUMB_HEIGHT,
          transform: "scale(var(--thumb-scale, 0.28))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
