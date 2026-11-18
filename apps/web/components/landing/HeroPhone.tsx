"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { frameShadow } from "@/components/marketing/styles";
import { KIND_PICKED_EVENT } from "./hero-brief";

// O celular do topo: captura real de um site de exemplo (negócio inventado, avisado na legenda).
// Quando a pessoa escolhe o tipo de negócio nas perguntas (evento `ns:kind-picked`), troca para um
// exemplo do mesmo ramo com um fade de 200ms (instantâneo com "reduzir movimento"). Tipos sem
// exemplo próprio mantêm o atual. Capturas em public/landing/wall (520×1125).

const PHONES = [
  {
    slug: "joes-plumbing",
    name: "Joe’s Plumbing",
    alt: "The Joe’s Plumbing example site, made with No Sweat, seen on a phone.",
  },
  {
    slug: "rosas-kitchen",
    name: "Rosa’s Kitchen",
    alt: "The Rosa’s Kitchen example site, made with No Sweat, seen on a phone.",
  },
  {
    slug: "glow-salon",
    name: "Glow Salon",
    alt: "The Glow Salon example site, made with No Sweat, seen on a phone.",
  },
  {
    slug: "hale-ortiz",
    name: "Hale & Ortiz",
    alt: "The Hale & Ortiz example site, made with No Sweat, seen on a phone.",
  },
] as const;

type Slug = (typeof PHONES)[number]["slug"];

/** Tipo de negócio (label de KINDS) → exemplo. Os outros tipos não trocam o celular. */
const BY_KIND: Record<string, Slug> = {
  "Home services": "joes-plumbing",
  "Food & drink": "rosas-kitchen",
  "Beauty & wellness": "glow-salon",
  "Professional services": "hale-ortiz",
};

export function HeroPhone() {
  const [current, setCurrent] = useState<Slug>("joes-plumbing");

  useEffect(() => {
    const onPick = (event: Event) => {
      const next = BY_KIND[(event as CustomEvent<string>).detail];
      if (next) setCurrent(next);
    };
    window.addEventListener(KIND_PICKED_EVENT, onPick);
    return () => window.removeEventListener(KIND_PICKED_EVENT, onPick);
  }, []);

  const active = PHONES.find((p) => p.slug === current) ?? PHONES[0];

  return (
    <figure className="w-[72%] max-w-[300px] lg:w-full">
      <div
        className={`relative aspect-[520/1125] overflow-hidden rounded-2xl border border-slate-200 bg-surface ${frameShadow}`}
      >
        {PHONES.map((phone) => {
          const on = phone.slug === current;
          return (
            <Image
              key={phone.slug}
              src={`/landing/wall/phone-${phone.slug}-top.webp`}
              width={520}
              height={1125}
              alt={on ? phone.alt : ""}
              aria-hidden={on ? undefined : true}
              // Só o primeiro carrega logo; os outros esperam (lazy) até serem precisos.
              loading={phone.slug === "joes-plumbing" ? "eager" : "lazy"}
              sizes="(min-width: 1024px) 300px, 72vw"
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200 ease-(--lp-ease) motion-reduce:transition-none ${
                on ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>
      <figcaption className="mt-3 text-[13px] leading-normal text-slate-500" aria-live="polite">
        {active.name}, an example site. The business is made up.
      </figcaption>
    </figure>
  );
}
