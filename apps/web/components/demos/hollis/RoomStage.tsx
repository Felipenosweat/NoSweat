"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROOMS, serviceById } from "./content";
import { PHOTOS } from "./photos";
import { Arrow, Caption, Credit, Photo, Tag } from "./ui";

// A assinatura da Hollis: "room by room". Um quadro só, com um índice pequeno de cômodos à
// esquerda e, à direita, a paleta lida da própria foto + o serviço que cobre aquele cômodo.
// - Computador com movimento completo: a seção fica presa (sticky) e a ROLAGEM troca o cômodo;
//   marcadores invisíveis (um por cômodo, 80svh cada) dizem ao IntersectionObserver qual está no
//   meio da tela (sem cálculo por quadro). A foto ativa dissolve por cima da anterior (1,4 s) e faz
//   um "pan" lento de câmera (CSS, por tempo, não pela rolagem). Clicar no índice rola até o cômodo.
// - Celular, tablet e "reduzir movimento": nada preso; o índice vira botões que trocam o cômodo.
// O que aparece é exemplo: as fotos são de banco e a página diz isso na legenda e na nota.

const SEGMENT_SVH = 80;

export function RoomStage() {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const section = useRef<HTMLElement>(null);
  const markers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPinned(wide.matches && !reduce.matches);
    update();
    wide.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = markers.current.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    markers.current.forEach((marker) => marker && observer.observe(marker));
    return () => observer.disconnect();
  }, [pinned]);

  const choose = useCallback(
    (index: number) => {
      if (!pinned || !section.current) {
        setActive(index);
        return;
      }
      // Presa: rola até o meio do trecho daquele cômodo (o observador troca a foto).
      const top = section.current.getBoundingClientRect().top + window.scrollY;
      const segment = (window.innerHeight * SEGMENT_SVH) / 100;
      window.scrollTo({ top: top + index * segment + segment * 0.2, behavior: "smooth" });
    },
    [pinned],
  );

  const room = ROOMS[active]!;
  const service = serviceById(room.service);
  const total = room.palette.reduce((sum, swatch) => sum + swatch.share, 0);

  return (
    <section
      ref={section}
      id="rooms"
      aria-labelledby="rooms-title"
      data-pinned={pinned || undefined}
      className="h-rooms relative"
      style={{ ["--rooms" as string]: ROOMS.length, ["--segment" as string]: `${SEGMENT_SVH}svh` }}
    >
      {pinned &&
        ROOMS.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => {
              markers.current[index] = el;
            }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0"
            style={{ top: `${index * SEGMENT_SVH}svh`, height: `${SEGMENT_SVH}svh` }}
          />
        ))}
      <div className="h-rooms-stage">
        <div className="h-wrap grid h-full gap-x-6 gap-y-8 lg:grid-cols-12">
          {/* Índice dos cômodos */}
          <div className="flex flex-col lg:col-span-3 lg:py-2">
            <Tag n="01">Room by room</Tag>
            <h2 id="rooms-title" className="h-h2 mt-5 max-w-[16ch]">
              Five rooms, and what we do in each.
            </h2>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-[1.6] text-[var(--h-muted)]">
              {pinned
                ? "Scroll, or pick a room. The palette on the right is read from each photograph."
                : "Pick a room. The palette is read from each photograph."}
            </p>
            <ol
              aria-label="Rooms"
              className="h-room-index mt-7 grid grid-cols-5 gap-1.5 lg:mt-auto lg:grid-cols-1 lg:gap-0"
            >
              {ROOMS.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={index === active}
                    onClick={() => choose(index)}
                    className="h-focus h-room-btn"
                  >
                    <span className="h-room-n tabular-nums">{item.n}</span>
                    <span className="h-room-name">{item.name}</span>
                    <span className="h-room-price hidden tabular-nums lg:inline">
                      {serviceById(item.service).price}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* O quadro: as cinco fotos empilhadas, a ativa por cima */}
          <figure className="lg:col-span-6 lg:flex lg:min-h-0 lg:flex-col">
            <div className="h-frame relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
              {ROOMS.map((item, index) => (
                <div
                  key={item.id}
                  aria-hidden={index !== active}
                  data-active={index === active || undefined}
                  className="h-slide absolute inset-0"
                >
                  <Photo
                    photo={PHOTOS[item.photo]}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    className="h-pan size-full object-cover"
                    style={{ objectPosition: item.focus }}
                    alt={index === active ? undefined : ""}
                  />
                </div>
              ))}
              <p aria-hidden="true" className="h-frame-n tabular-nums">
                {room.n} / 0{ROOMS.length}
              </p>
            </div>
            <Caption
              left={
                <>
                  {room.n} · {room.name} ·{" "}
                  <span className="text-[var(--h-muted)]">Example room</span>
                </>
              }
              right={<Credit photo={PHOTOS[room.photo]} />}
            />
          </figure>

          {/* Paleta lida da foto + o serviço deste cômodo */}
          <div className="lg:col-span-3 lg:flex lg:flex-col lg:py-2">
            <div key={room.id} className="h-swap">
              <p className="h-tag">Palette · read from this photograph</p>
              <div aria-hidden="true" className="mt-4 flex h-16 overflow-hidden lg:h-24">
                {room.palette.map((swatch) => (
                  <span
                    key={swatch.hex}
                    className="h-strip block h-full"
                    style={{ flexGrow: swatch.share, backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
              <ul className="mt-4 divide-y divide-[var(--h-line)] border-y border-[var(--h-line)]">
                {room.palette.map((swatch) => (
                  <li key={swatch.hex} className="flex items-center gap-3 py-2.5 text-[14px]">
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded-full ring-1 ring-[var(--h-line)]"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span>{swatch.name}</span>
                    <span className="ml-auto text-[var(--h-muted)] tabular-nums">
                      {swatch.hex} · {Math.round((swatch.share / total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--h-muted)]">
                An example palette: four tones sampled from the photo, sized by how much of it they
                cover.
              </p>
            </div>
            <div key={`${room.id}-service`} className="h-swap mt-8 lg:mt-auto">
              <p className="h-tag">The service</p>
              <p className="mt-3 text-[19px] leading-[1.3]">{service.name}</p>
              <p className="mt-1 text-[15px] tabular-nums">
                {service.price} <span className="text-[var(--h-muted)]">· {service.time}</span>
              </p>
              <p className="mt-3 text-[14px] leading-[1.6] text-[var(--h-muted)]">{room.scope}</p>
              <a href="#services" className="h-focus h-more mt-4">
                All services and fees <Arrow />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
