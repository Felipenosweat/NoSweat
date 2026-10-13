"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Tamanho "real" da janela desenhada na miniatura (desktop, proporção 16:10). */
export const THUMB_WIDTH = 1280;
export const THUMB_HEIGHT = 800;

/**
 * Caixa 16:10 que reduz o conteúdo (renderizado no servidor) até caber na largura do card.
 * Só mede a largura no navegador; antes disso usa uma escala aproximada de um card comum.
 */
export function SiteThumbFrame({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => setScale(box.clientWidth / THUMB_WIDTH));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      inert
      className="pointer-events-none relative aspect-[16/10] w-full overflow-hidden bg-slate-100 select-none"
    >
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
