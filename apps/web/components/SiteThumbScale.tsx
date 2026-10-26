"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Elemento vazio dentro da caixa da miniatura: mede a largura da caixa (o pai) e grava a escala
 * em `--thumb-scale` direto no estilo dela. Sem estado do React: redimensionar não re-renderiza
 * nada, e o site desenhado nunca passa por aqui.
 */
export function SiteThumbScale({ width }: { width: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;
    const apply = () => box.style.setProperty("--thumb-scale", String(box.clientWidth / width));
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  return <span ref={ref} hidden />;
}
