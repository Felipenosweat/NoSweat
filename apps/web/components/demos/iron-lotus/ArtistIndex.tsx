"use client";

import { useEffect, useRef, useState } from "react";
import { ARTISTS, type ArtistId } from "./content";
import { PHOTOS, type PhotoKey } from "./photos";
import { Cutout } from "./ui";

// Índice dos artistas (hierarquia por índice): três linhas numeradas com nome enorme, estilos,
// preço da fixture e o depoimento que o dono deu sobre cada um. No computador, a moldura presa
// à direita troca de cena conforme a linha sob o mouse ou o foco (a linha "anda" um pouco:
// movimento cinético contido). As fotos são CENAS de exemplo, não o trabalho de cada artista,
// e a legenda diz isso. "Ask Mara" preenche o artista na ficha de consulta (evento "il:artist").

const SCENE: Record<ArtistId, PhotoKey> = { mara: "blackwork", theo: "script", lena: "color" };
const TILT: Record<ArtistId, number> = { mara: -3, theo: 2.5, lena: -1.5 };

export function ArtistIndex() {
  const [active, setActive] = useState<ArtistId>("mara");
  const list = useRef<HTMLOListElement>(null);

  // O índice também "corre" com a rolagem: a linha que passa pelo meio da tela vira a ativa
  // (a moldura troca de cena sem precisar do mouse).
  useEffect(() => {
    const rows = Array.from(list.current?.querySelectorAll<HTMLElement>("[data-artist]") ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive((entry.target as HTMLElement).dataset.artist as ArtistId);
      },
      { rootMargin: "-42% 0px -52% 0px" },
    );
    for (const row of rows) observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const ask = (artist: ArtistId) =>
    window.dispatchEvent(new CustomEvent<ArtistId>("il:artist", { detail: artist }));

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <ol ref={list} className="border-t-2 border-[var(--il-ink)] lg:col-span-8">
        {ARTISTS.map((artist) => {
          const on = active === artist.id;
          const photo = PHOTOS[SCENE[artist.id]];
          return (
            <li
              key={artist.id}
              data-artist={artist.id}
              data-on={on || undefined}
              onMouseEnter={() => setActive(artist.id)}
              onFocusCapture={() => setActive(artist.id)}
              className="il-artist border-b border-[var(--il-rule)] py-8 lg:py-10"
            >
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[4.5rem_1fr]">
                <p className="il-artist-no il-display text-[44px] leading-[0.8]" aria-hidden="true">
                  {artist.no}
                </p>
                <div className="min-w-0">
                  <h3 className="il-artist-name il-display text-[clamp(3rem,7vw,6.25rem)] leading-[0.82] uppercase">
                    {artist.name}
                  </h3>
                  <p className="il-mono mt-4 flex flex-wrap gap-2 text-[12px] tracking-[0.06em] uppercase">
                    <span className="il-chip il-chip-ink">{artist.role}</span>
                    {artist.styles.map((style) => (
                      <span key={style} className="il-chip">
                        {style}
                      </span>
                    ))}
                  </p>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-10">
                    <div>
                      <p className="max-w-[44ch] text-[17px] leading-[1.6]">{artist.note}</p>
                      <p className="il-mono mt-4 text-[13px] leading-[1.55] text-[var(--il-ink-soft)]">
                        {artist.price}
                      </p>
                      <a
                        href="#consult"
                        onClick={() => ask(artist.id)}
                        className="il-btn il-btn-line mt-6"
                      >
                        Ask {artist.first} about your idea
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                    {artist.quote ? (
                      <blockquote className="il-note self-start">
                        <p className="text-[16px] leading-[1.5]">“{artist.quote.text}”</p>
                        <footer className="il-mono mt-3 text-[11px] tracking-[0.08em] text-[var(--il-ink-soft)] uppercase">
                          {artist.quote.author} · client
                        </footer>
                      </blockquote>
                    ) : null}
                  </div>
                  <Cutout
                    photo={photo}
                    sizes="(min-width: 640px) 60vw, 90vw"
                    ratio={4 / 3}
                    tilt={TILT[artist.id]}
                    caption={`${photo.caption}, not ${artist.first}'s work`}
                    className="mt-8 max-w-[440px] lg:hidden"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hidden lg:col-span-4 lg:block">
        <div className="il-frame sticky top-16 aspect-[3/3.4]" data-il-frame>
          {ARTISTS.map((artist) => {
            const photo = PHOTOS[SCENE[artist.id]];
            const on = active === artist.id;
            return (
              <div
                key={artist.id}
                className="il-frame-slot"
                data-on={on || undefined}
                aria-hidden={!on}
              >
                <Cutout
                  photo={photo}
                  sizes="30vw"
                  ratio={4 / 5}
                  tilt={TILT[artist.id]}
                  caption={`${photo.caption}, not ${artist.first}'s work`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
