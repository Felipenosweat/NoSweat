"use client";

import { useEffect } from "react";

// A faixa da prévia fica grudada no topo; o menu fixo do site (`.ns-nav`, top-4) desceria por
// baixo dela. Mede a altura da faixa (muda com a largura) e põe em --ns-preview-bar; o CSS da
// página empurra o menu para baixo da faixa.

export function PreviewBarOffset({ targetId }: { targetId: string }) {
  useEffect(() => {
    const bar = document.getElementById(targetId);
    if (!bar) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--ns-preview-bar", `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--ns-preview-bar");
    };
  }, [targetId]);
  return null;
}
