"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowRightIcon } from "./icons";
import { captionClass, focusRing, frameShadow, panelTitleClass, textLink } from "./styles";
import { UrlMotif } from "./UrlMotif";
import { PIN_LABEL, PIN_ORDER, type Box, type PinKey, type WorkOrder } from "./work-orders";

// Parte interativa da "Ordem de serviço": abas por ofício, trechos numerados na ficha e pinos
// no site. Passar o mouse ou focar um item da lista acende o lugar no site; tocar/clicar fixa.
// Os pinos sobre a imagem são decorativos (aria-hidden): a lista "Where it lands" diz o mesmo
// em texto. Sem animação com prefers-reduced-motion (motion-reduce:transition-none).

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & { src: string };
export type ShotProps = { desktop: ImgProps; phone: ImgProps };

const pinNumber = (pin: PinKey) => PIN_ORDER.indexOf(pin) + 1;

export function WorkOrderTabs({ orders, shots }: { orders: WorkOrder[]; shots: ShotProps[] }) {
  const id = useId();
  const [tab, setTab] = useState(0);
  const [hovered, setHovered] = useState<PinKey | null>(null);
  const [pinned, setPinned] = useState<PinKey | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Imagens já carregadas (por src): os pinos só aparecem por cima de uma imagem pronta.
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const markLoaded = (src: string) => setLoaded((current) => ({ ...current, [src]: true }));

  // Depois que a página assenta, aquece as capturas das outras abas (no tamanho da tela atual),
  // para trocar de aba sem moldura vazia. O navegador reaproveita o cache.
  useEffect(() => {
    const warm = () => {
      const wide = window.matchMedia("(min-width: 768px)").matches;
      for (const item of shots.slice(1)) {
        const variant = wide ? item.desktop : item.phone;
        const img = new window.Image();
        if (variant.sizes) img.sizes = variant.sizes;
        if (variant.srcSet) img.srcset = variant.srcSet;
        img.src = variant.src;
      }
    };
    const timer = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(timer);
  }, [shots]);
  const order = orders[tab] ?? orders[0];
  const shot = shots[tab] ?? shots[0];
  if (!order || !shot) return null;

  const active = hovered ?? pinned;

  function select(index: number) {
    setTab(index);
    setHovered(null);
    setPinned(null);
  }

  // Abas com setas, Home e End (padrão WAI-ARIA de tabs com ativação automática).
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const last = orders.length - 1;
    const next =
      event.key === "ArrowRight"
        ? tab === last
          ? 0
          : tab + 1
        : event.key === "ArrowLeft"
          ? tab === 0
            ? last
            : tab - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p id={`${id}-label`} className="text-sm font-semibold text-ink">
          See a work order for a
        </p>
        <div
          role="tablist"
          aria-labelledby={`${id}-label`}
          className="-mx-5 flex max-w-[calc(100%+2.5rem)] gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:max-w-full sm:rounded-lg sm:border sm:border-slate-300 sm:bg-white sm:p-1 [&::-webkit-scrollbar]:hidden"
        >
          {orders.map((item, index) => {
            const selected = index === tab;
            return (
              <button
                key={item.slug}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(index)}
                onKeyDown={onTabKey}
                className={`flex min-h-11 shrink-0 items-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                  selected
                    ? "bg-ink text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:text-ink sm:border-0"
                }`}
              >
                {item.trade}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${tab}`}
        className="mt-6 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-12 lg:items-start lg:gap-10"
      >
        {/* ---------- A ficha ---------- */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <p className={panelTitleClass}>Work order</p>
            <p className="text-[13px] text-slate-500 tabular-nums">No. {order.ticket}</p>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className={captionClass}>What the owner typed</p>
            <p className="mt-2 text-[17px] leading-[1.75] text-pretty text-ink">
              {order.sentence.map((segment, index) =>
                typeof segment === "string" ? (
                  <span key={index}>{segment}</span>
                ) : (
                  <span
                    key={index}
                    onMouseEnter={() => setHovered(segment.pin)}
                    onMouseLeave={() => setHovered(null)}
                    className={`rounded-[3px] px-0.5 [box-decoration-break:clone] transition-colors duration-150 motion-reduce:transition-none ${
                      active === segment.pin ? "bg-brand/15 text-ink" : "bg-slate-100 text-ink"
                    }`}
                  >
                    <span className={segment.pin === "phone" ? "whitespace-nowrap" : undefined}>
                      {segment.text}
                    </span>
                    <sup
                      aria-hidden="true"
                      className="ml-0.5 align-super text-[11px] font-semibold text-brand tabular-nums"
                    >
                      {pinNumber(segment.pin)}
                    </sup>
                  </span>
                ),
              )}
            </p>
          </div>

          <div className="border-t border-slate-200 px-5 py-5 sm:px-6">
            <p id={`${id}-lands`} className={captionClass}>
              Where it lands on the website
            </p>
            <ol aria-labelledby={`${id}-lands`} className="mt-2 -mx-2">
              {PIN_ORDER.map((pin) => {
                const on = active === pin;
                return (
                  <li key={pin}>
                    <button
                      type="button"
                      aria-pressed={pinned === pin}
                      onMouseEnter={() => setHovered(pin)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(pin)}
                      onBlur={() => setHovered(null)}
                      onClick={() => setPinned((current) => (current === pin ? null : pin))}
                      className={`flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                        on ? "bg-brand/[0.07]" : "hover:bg-slate-50"
                      }`}
                    >
                      <PinBadge number={pinNumber(pin)} />
                      <span className="min-w-0 text-[15px] leading-snug">
                        <span className="font-semibold text-ink">{PIN_LABEL[pin]}</span>
                        <span className="text-slate-500"> → </span>
                        <span className="text-slate-600">{order.lands[pin]}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 px-5 py-3 sm:px-6">
            <p className={captionClass}>Example · fictional business</p>
            <Link
              href={`/examples/${order.slug}`}
              className={`inline-flex min-h-11 items-center gap-1.5 text-sm ${textLink}`}
            >
              Open the live example
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>

        {/* ---------- O site gerado ---------- */}
        <div className="order-first lg:sticky lg:top-24 lg:order-none lg:col-span-7">
          {/* Celular: a captura do celular com os pinos. */}
          <div className="md:hidden">
            <div
              className={`relative mx-auto w-[min(68vw,280px)] overflow-hidden rounded-xl border-[6px] border-ink bg-ink ${frameShadow}`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- props vêm do getImageProps (otimizada) */}
                <img
                  key={shot.phone.src}
                  {...shot.phone}
                  alt={shot.phone.alt}
                  fetchPriority={tab === 0 ? "high" : "auto"}
                  onLoad={() => markLoaded(shot.phone.src)}
                  ref={(img) => {
                    if (img?.complete && img.naturalWidth > 0 && !loaded[shot.phone.src]) {
                      markLoaded(shot.phone.src);
                    }
                  }}
                  className="block aspect-[780/1688] h-auto w-full bg-surface"
                />
                {loaded[shot.phone.src] && (
                  <Pins boxes={order.phone} active={active} variant="phone" />
                )}
              </div>
            </div>
          </div>

          {/* Tablet e desktop: navegador com o endereço grátis. */}
          <div className="hidden md:block">
            <BrowserFrame address={<UrlMotif slug={order.slug} />}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- props vêm do getImageProps (otimizada) */}
                <img
                  key={shot.desktop.src}
                  {...shot.desktop}
                  alt={shot.desktop.alt}
                  fetchPriority={tab === 0 ? "high" : "auto"}
                  onLoad={() => markLoaded(shot.desktop.src)}
                  ref={(img) => {
                    if (img?.complete && img.naturalWidth > 0 && !loaded[shot.desktop.src]) {
                      markLoaded(shot.desktop.src);
                    }
                  }}
                  className="block aspect-[2560/1720] h-auto w-full bg-surface"
                />
                {loaded[shot.desktop.src] && (
                  <Pins boxes={order.desktop} active={active} variant="desktop" />
                )}
              </div>
            </BrowserFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

function PinBadge({ number }: { number: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white tabular-nums"
    >
      {number}
    </span>
  );
}

/**
 * Onde fica o pino de cada lugar, para não cobrir o que ele aponta nem bater no vizinho:
 * no computador, à esquerda (na margem vazia) e o do nome à direita (o logo fica à esquerda);
 * no celular a margem é estreita, então os pinos ficam à direita ou no canto de dentro.
 */
function pinAnchor(pin: PinKey, box: Box, variant: "desktop" | "phone"): { x: number; y: number } {
  const midY = box.y + box.h / 2;
  const right = { x: box.x + box.w + (variant === "phone" ? 6.5 : 2.6), y: midY };
  const left = { x: box.x - (variant === "phone" ? 5 : 2.2), y: midY };
  if (variant === "desktop") return pin === "name" ? right : left;
  if (pin === "phone") return left;
  if (pin === "offer") return { x: box.x + box.w - 6, y: box.y };
  return right;
}

/** Pinos numerados e o contorno do lugar ativo, por cima da captura. */
function Pins({
  boxes,
  active,
  variant,
}: {
  boxes: Record<PinKey, Box>;
  active: PinKey | null;
  variant: "desktop" | "phone";
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {PIN_ORDER.map((pin) => {
        const box = boxes[pin];
        const on = active === pin;
        const dim = active !== null && !on;
        return (
          <span key={pin}>
            <span
              className={`absolute rounded-md border-2 border-brand bg-brand/10 transition-opacity duration-150 motion-reduce:transition-none ${
                on ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: `${box.x - 0.6}%`,
                top: `${box.y - 0.6}%`,
                width: `${box.w + 1.2}%`,
                height: `${box.h + 1.2}%`,
              }}
            />
            <span
              className={`absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white shadow-[0_0_0_3px_white] tabular-nums transition-opacity duration-150 motion-reduce:transition-none ${
                dim ? "opacity-30" : "opacity-100"
              }`}
              style={{
                left: `${pinAnchor(pin, box, variant).x}%`,
                top: `${pinAnchor(pin, box, variant).y}%`,
              }}
            >
              {PIN_ORDER.indexOf(pin) + 1}
            </span>
          </span>
        );
      })}
    </div>
  );
}
