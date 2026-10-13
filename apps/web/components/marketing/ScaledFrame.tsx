"use client";

import { useEffect, useRef, useState } from "react";

type ScaledFrameProps = {
  src: string;
  title: string;
  /** Largura "real" da janela dentro do iframe (1280 = desktop, 390 = celular). */
  viewportWidth: number;
  viewportHeight: number;
  loading?: "eager" | "lazy";
};

/**
 * Mostra uma página inteira em miniatura: o iframe tem o tamanho de uma tela de verdade
 * (para o site usar o layout certo) e é reduzido com `scale` até caber na largura disponível.
 * Não é interativo: quem quiser navegar abre o exemplo completo.
 */
export function ScaledFrame({
  src,
  title,
  viewportWidth,
  viewportHeight,
  loading = "lazy",
}: ScaledFrameProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / viewportWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [viewportWidth]);

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden bg-slate-100"
      style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}
      inert
    >
      <iframe
        src={src}
        title={title}
        loading={loading}
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500"
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale ?? 0})`,
          opacity: scale ? 1 : 0,
        }}
      />
    </div>
  );
}
