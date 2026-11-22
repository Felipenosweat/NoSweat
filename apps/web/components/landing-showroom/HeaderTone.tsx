"use client";

import { useEffect } from "react";

// O cabeçalho começa escuro (sobre o bloco ink do topo). Quando o bloco ink passa por baixo do
// cabeçalho, ele vira branco com linha fina. Sem JS, fica escuro (legível em qualquer fundo).
export function HeaderTone({ headerId, blockId }: { headerId: string; blockId: string }) {
  useEffect(() => {
    const header = document.getElementById(headerId);
    const block = document.getElementById(blockId);
    if (!header || !block) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const dark = block.getBoundingClientRect().bottom > header.offsetHeight;
      header.dataset.tone = dark ? "dark" : "light";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headerId, blockId]);
  return null;
}
