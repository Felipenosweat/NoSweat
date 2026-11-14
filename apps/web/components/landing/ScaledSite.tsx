"use client";

import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Um site de exemplo de verdade (o mesmo <SiteRenderer> dos sites publicados), desenhado na
// largura de uma tela (`width`, ex.: 1440 ou 390) e encolhido (transform: scale) para caber na
// moldura. `anchors={false}` desliga ids e o movimento próprio do site (Motion/GSAP do molde
// Signature), que brigaria com a moldura. Carregado só no navegador (next/dynamic, ssr: false):
// não pesa no HTML nem no LCP do topo. `onReady` entrega a raiz para quem anima os blocos.

type ScaledSiteProps = {
  spec: SiteSpec;
  width: number;
  onReady?: (root: HTMLElement) => void;
};

export default function ScaledSite({ spec, width, onReady }: ScaledSiteProps) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    if (box.current && scale > 0) onReady?.(box.current);
    // Só quando o site (ou a escala inicial) muda; `onReady` é estável no chamador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, scale > 0]);

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      <div
        className="origin-top-left"
        style={{ width, transform: `scale(${scale})`, opacity: scale > 0 ? 1 : 0 }}
      >
        <SiteRenderer spec={spec} anchors={false} />
      </div>
    </div>
  );
}
