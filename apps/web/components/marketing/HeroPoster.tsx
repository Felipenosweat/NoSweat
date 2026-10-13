import { getImageProps } from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowRightIcon } from "./icons";
import { frameShadow, textLink } from "./styles";
import { UrlMotif } from "./UrlMotif";

// Resultado do hero: captura ESTÁTICA do site de exemplo (sem iframe), nunca animada a partir
// de opacidade 0 (é o maior elemento da tela). Desktop/tablet: moldura de navegador com 2
// anotações e o único brilho ciano da página. Celular: a captura do celular com 260px.
// Só esta imagem tem preload, e cada versão só é baixada no tamanho de tela em que aparece.

const DESKTOP_SIZES = "(min-width: 1024px) 680px, 100vw";

// Coordenadas (em % da captura) dos alvos das anotações. Se a captura for refeita com outro
// layout, ajustar aqui.
// O ponto fica na BORDA do botão (não em cima do texto): topo do botão de ligar, base do
// botão de orçamento.
const CALL_TARGET = { x: 89, y: 6.8 };
const ESTIMATE_TARGET = { x: 12, y: 76.2 };

// Distância da borda da imagem até fora da moldura: barra de endereço (2.5rem) + borda + 1rem.
const OUTSIDE = "(2.5rem + 1px + 1rem)";

export function HeroPoster() {
  const { props: desktop } = getImageProps({
    src: "/shots/joes-plumbing-desktop.webp",
    alt: "Example website for Joe’s Plumbing, a fictional plumber in Austin, TX, on a desktop screen",
    width: 2560,
    height: 1720,
    sizes: DESKTOP_SIZES,
  });
  const { props: phone } = getImageProps({
    src: "/shots/joes-plumbing-phone.webp",
    alt: "Example website for Joe’s Plumbing, a fictional plumber in Austin, TX, on a phone",
    width: 780,
    height: 1688,
    sizes: "260px",
  });

  // Preload com `media`: o celular não baixa a captura grande e vice-versa. As <img> ficam com
  // loading="lazy" (padrão do getImageProps) porque a versão escondida por CSS não pode baixar;
  // a versão visível já chega pelo preload com prioridade alta.
  preload(desktop.src, {
    as: "image",
    imageSrcSet: desktop.srcSet,
    imageSizes: DESKTOP_SIZES,
    fetchPriority: "high",
    media: "(min-width: 768px)",
  });
  preload(phone.src, {
    as: "image",
    imageSrcSet: phone.srcSet,
    imageSizes: "260px",
    fetchPriority: "high",
    media: "(max-width: 767.98px)",
  });

  return (
    <div>
      {/* Celular: captura do celular com moldura ink fina. */}
      <div className="md:hidden">
        <div
          className={`mx-auto w-[260px] overflow-hidden rounded-xl border-[6px] border-ink bg-ink ${frameShadow}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- props vêm do getImageProps (otimizada) */}
          <img {...phone} alt={phone.alt} fetchPriority="high" className="block h-auto w-full" />
        </div>
      </div>

      {/* Tablet e desktop: navegador anotado, com espaço em cima e embaixo para as legendas. */}
      <div className="relative hidden pt-12 pb-14 md:block">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-16 -inset-y-8 bg-[radial-gradient(60%_50%_at_70%_40%,rgb(0_194_255/.10),transparent_70%)]"
        />
        <BrowserFrame address={<UrlMotif slug="joes-plumbing" />} className="relative">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- props vêm do getImageProps (otimizada) */}
            <img
              {...desktop}
              alt={desktop.alt}
              fetchPriority="high"
              className="block h-auto w-full"
            />
          </div>
        </BrowserFrame>

        {/* Camada das anotações, alinhada com a área da imagem (abaixo da barra de endereço). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-px top-[calc(3rem+2.5rem+1px)] bottom-[calc(3.5rem+1px)]"
        >
          {/* 1. Ligar com um toque: legenda acima da moldura, linha descendo até o botão. */}
          <Dot x={CALL_TARGET.x} y={CALL_TARGET.y} />
          <span
            className="absolute w-px bg-slate-300"
            style={{
              left: `${CALL_TARGET.x}%`,
              top: `calc(-1 * ${OUTSIDE})`,
              height: `calc(${CALL_TARGET.y}% + ${OUTSIDE})`,
            }}
          />
          <span
            className="absolute -mr-px pb-1.5 text-[13px] font-medium whitespace-nowrap text-slate-600"
            style={{ right: `${100 - CALL_TARGET.x}%`, bottom: `calc(100% + ${OUTSIDE})` }}
          >
            Tap to call, on every page
          </span>

          {/* 2. Pedido de orçamento: linha descendo do botão até fora da moldura. */}
          <Dot x={ESTIMATE_TARGET.x} y={ESTIMATE_TARGET.y} />
          <span
            className="absolute w-px bg-slate-300"
            style={{
              left: `${ESTIMATE_TARGET.x}%`,
              top: `${ESTIMATE_TARGET.y}%`,
              height: `calc(${100 - ESTIMATE_TARGET.y}% + 1px + 1rem)`,
            }}
          />
          <span
            className="absolute pt-1.5 text-[13px] font-medium whitespace-nowrap text-slate-600"
            style={{ left: `${ESTIMATE_TARGET.x}%`, top: "calc(100% + 1px + 1rem)" }}
          >
            Estimate requests go to your email
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:mt-0 md:justify-between">
        <Link
          href="/examples/joes-plumbing"
          className={`inline-flex min-h-11 items-center gap-1.5 text-sm ${textLink}`}
        >
          Open the live example
          <ArrowRightIcon className="size-4" />
        </Link>
        <p className="text-[13px] text-slate-500">Joe’s Plumbing is a fictional business.</p>
      </div>
    </div>
  );
}

/** Ponto de ancoragem da anotação (anel fino sobre a captura). */
function Dot({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-slate-400"
      style={{ left: `calc(${x}% + 0.5px)`, top: `${y}%` }}
    />
  );
}
