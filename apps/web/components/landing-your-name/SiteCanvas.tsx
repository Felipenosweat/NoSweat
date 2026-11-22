"use client";

import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import { useLayoutEffect, useRef } from "react";

// Carregado só sob demanda (next/dynamic em PreviewFrames.tsx): o <SiteRenderer> e as
// composições ficam num pedaço de JS separado, fora do caminho do título (LCP).
// `anchors={false}`: sem ids de seção, sem abertura animada e sem movimento ao rolar.
export default function SiteCanvas({ spec }: { spec: SiteSpec }) {
  const ref = useRef<HTMLDivElement>(null);

  // A moldura mostra o site parado no topo: o cabeçalho fica no estado "no topo" (transparente,
  // no tom do hero), que no site publicado o Motion.tsx liga. Sem movimento aqui, liga-se à mão.
  useLayoutEffect(() => {
    ref.current?.querySelectorAll(".ns-nav").forEach((nav) => nav.setAttribute("data-top", ""));
  });

  return (
    <div ref={ref} className="contents">
      <SiteRenderer spec={spec} anchors={false} />
    </div>
  );
}
