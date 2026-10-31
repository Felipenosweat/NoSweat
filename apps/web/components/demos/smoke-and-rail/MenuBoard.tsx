"use client";

import { useState } from "react";
import { BUSINESS, MENU, type MenuItem } from "./content";
import { PHOTOS } from "./photos";
import { Flap, Photo } from "./ui";

// O cardápio como placa de partidas da estação: cada prato é uma linha, o preço e o aviso
// ("Thu & Sat only", "48 hrs notice") em plaquinhas que giram uma vez ao entrar na tela.
// No computador, a foto à esquerda fica presa e troca quando o mouse passa por uma linha
// (só enfeite: o texto da linha já diz tudo). No celular, a foto vem antes da placa.

const FRAME_PHOTOS: MenuItem["photo"][] = ["sliced", "bark", "ribs", "pork", "tray", "whole"];

const CAPTION: Record<MenuItem["photo"], string> = {
  sliced: "Brisket, cut to order",
  bark: "Bark on the point, where burnt ends come from",
  ribs: "Spare ribs",
  pork: "Pulled pork sandwiches",
  tray: "Meats and sides",
  whole: "A whole brisket",
};

export function MenuBoard() {
  const [active, setActive] = useState<MenuItem["photo"]>("sliced");

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      <figure className="lg:col-span-5">
        <div className="sr-menu-frame relative aspect-[16/11] overflow-hidden lg:sticky lg:top-24 lg:aspect-[4/5]">
          {FRAME_PHOTOS.map((key) => (
            <Photo
              key={key}
              photo={PHOTOS[key]}
              sizes="(min-width: 1024px) 40vw, 100vw"
              ratio={0.8}
              alt={key === active ? PHOTOS[key].alt : ""}
              className="sr-menu-photo absolute inset-0 size-full object-cover"
              style={{ opacity: key === active ? 1 : 0 }}
            />
          ))}
          <figcaption className="sr-label absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent px-4 pt-12 pb-4 text-[11px] text-[var(--sr-smoke)]">
            <span aria-live="polite">{CAPTION[active]}</span>
          </figcaption>
        </div>
      </figure>

      <div className="lg:col-span-7">
        <div className="sr-board">
          <div className="sr-board-head sr-label hidden text-[11px] text-[var(--sr-ash)] sm:grid">
            <span>Item</span>
            <span>Price</span>
            <span className="text-right">Note</span>
          </div>
          <ul>
            {MENU.map((item) => (
              <li
                key={item.key}
                className="sr-board-row"
                data-active={item.photo === active || undefined}
                onPointerEnter={() => setActive(item.photo)}
              >
                <div className="sr-board-item">
                  <p className="sr-display text-[clamp(1.9rem,3.2vw,2.6rem)] leading-[0.95]">
                    {item.name}
                    <span className="sr-label ml-3 align-middle text-[11px] text-[var(--sr-ash)]">
                      {item.unit}
                    </span>
                  </p>
                  <p className="mt-1.5 max-w-[46ch] text-[15px] leading-[1.5] text-[var(--sr-ash)]">
                    {item.description}
                  </p>
                </div>
                <Flap text={item.price} className="sr-board-price text-[22px] sm:text-[26px]" />
                <div className="sr-board-note">
                  {item.status ? (
                    <Flap text={item.status.toUpperCase()} className="sr-flap-ember text-[13px]" />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[40ch] text-[16px] leading-[1.6] text-[var(--sr-smoke)]/85">
            Sauce always comes on the side. Burnt ends are on Thursdays and Saturdays only, and
            whole briskets need 48 hours notice.
          </p>
          <a
            href={BUSINESS.order}
            target="_blank"
            rel="noopener noreferrer"
            className="sr-btn sr-focus inline-flex h-12 shrink-0 items-center self-start px-6 text-[13px]"
          >
            Preorder for pickup
          </a>
        </div>
      </div>
    </div>
  );
}
