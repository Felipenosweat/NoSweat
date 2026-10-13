"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from "react";

export type Device = "desktop" | "tablet" | "phone";

/** Largura real de cada aparelho na prévia e a espessura da moldura. */
const FRAMES: Record<Exclude<Device, "desktop">, { width: number; bezel: number }> = {
  tablet: { width: 768, bezel: 1 },
  phone: { width: 390, bezel: 8 },
};

/** Media query reativa; no servidor usa `serverValue`. */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Mesma quebra do `lg:` do Tailwind (64rem). */
export const DESKTOP_QUERY = "(min-width: 64rem)";

const frameShadow = "shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)]";

/**
 * Moldura da prévia. O site roda num iframe da mesma origem, então as media e container
 * queries respondem à largura escolhida: computador = largura toda, tablet = 768px,
 * celular = 390px com moldura escura. Se a área for menor que o aparelho, a moldura
 * é reduzida (scale) sem mudar a largura que o site enxerga.
 * No celular (abaixo de lg) a prévia ocupa a tela toda, sem moldura.
 */
export function CanvasFrame({
  src,
  device,
  iframeRef,
}: {
  src: string;
  device: Device;
  iframeRef: Ref<HTMLIFrameElement>;
}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const area = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const framed = isDesktop && device !== "desktop" ? FRAMES[device] : null;
  let style: CSSProperties = { width: "100%", height: "100%" };
  if (framed && size) {
    const outer = framed.width + framed.bezel * 2;
    const scale = Math.min(1, size.width / outer);
    style = {
      width: outer,
      height: size.height / scale,
      flexShrink: 0,
      transform: scale < 1 ? `scale(${scale})` : undefined,
      transformOrigin: "top center",
    };
  }

  const frameClass = !isDesktop
    ? ""
    : device === "phone"
      ? `rounded-xl border-8 border-ink ${frameShadow}`
      : device === "tablet"
        ? `rounded-xl border border-slate-300 ${frameShadow}`
        : `rounded-xl border border-slate-200 ${frameShadow}`;

  return (
    <div
      ref={area}
      className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden bg-surface lg:p-6"
    >
      <div style={style} className={`overflow-hidden bg-white ${frameClass}`}>
        <iframe
          ref={iframeRef}
          src={src}
          title="Live preview of your website"
          className="block size-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
