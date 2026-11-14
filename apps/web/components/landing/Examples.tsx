import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SITES } from "./sites";
import { bodyClass, focusRing, h2Class, sectionBody, sectionHead, shell } from "./type";

// Exemplos (#looks): os seis sites de exemplo numa grade (2 colunas no celular e no tablet, 3 no
// computador), cada um com a captura de verdade (public/landing/signature/<slug>-d.webp) numa
// moldura de 16 px, o nome e "ramo, cidade", e um link para o site inteiro (/examples/<slug>).
// Negócios fictícios, avisado no texto. As capturas são enfeite do link (alt vazio): o nome
// acessível é o nome do negócio + ramo e cidade. Hover/foco: a captura cresce 2% dentro da
// moldura (que não muda de tamanho) e o nome ganha sublinhado.

export function Examples() {
  return (
    <section id="looks" aria-labelledby="looks-title" className={`${shell} pt-24 lg:pt-32`}>
      <div className={`lp-reveal ${sectionHead}`}>
        <h2 id="looks-title" className={h2Class}>
          Example sites.
        </h2>
        <p className={bodyClass}>Made-up businesses, real No Sweat sites.</p>
      </div>
      <ul
        className={`${sectionBody} grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-y-12`}
      >
        {SITES.map((site, index) => (
          <li
            key={site.slug}
            className="lp-reveal min-w-0"
            style={{ "--i": index % 3 } as CSSProperties}
          >
            <Link
              href={`/examples/${site.slug}`}
              className={`group block rounded-2xl ${focusRing}`}
            >
              <span className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <Image
                  src={`/landing/signature/${site.slug}-d.webp`}
                  width={1600}
                  height={1000}
                  alt=""
                  sizes="(min-width: 1280px) 380px, (min-width: 1024px) 31vw, 46vw"
                  className="aspect-[16/10] w-full object-cover object-top transition-transform duration-200 ease-out group-hover:scale-[1.02] group-focus-visible:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </span>
              <span className="mt-3 flex flex-col px-1 sm:mt-4">
                <span className="font-display text-base leading-snug font-bold tracking-[-0.01em] text-ink decoration-1 underline-offset-4 group-hover:underline group-focus-visible:underline sm:text-xl">
                  {site.name}
                </span>
                <span className="text-sm leading-normal text-slate-600 sm:text-[15px]">
                  {site.kind}, {site.place}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
