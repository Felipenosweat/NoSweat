import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "./icons";
import { container, textLink } from "./styles";

// Faixa "Built with No Sweat": capturas estáticas dos sites de exemplo (negócios fictícios).
// A faixa é decorativa (aria-hidden); o link visível "See examples" leva à seção de exemplos.
// Desktop: rola sozinha (40s, pausa no hover). Celular e movimento reduzido: rolagem manual com snap.

const SLUGS: FixtureSlug[] = ["joes-plumbing", "glow-salon", "sparkle-cleaning", "rosas-kitchen"];

type Tile = { slug: FixtureSlug; kind: "desktop" | "phone" };

// Alterna desktop e celular para a faixa não parecer o mesmo cartão repetido.
const TILES: Tile[] = SLUGS.flatMap((slug) => [
  { slug, kind: "desktop" as const },
  { slug, kind: "phone" as const },
]);

/** Itens só da animação do desktop (escondidos no celular/movimento reduzido via CSS). */
function MarqueeTile({ tile, duplicate = false }: { tile: Tile; duplicate?: boolean }) {
  const { business } = fixtures[tile.slug];
  const desktop = tile.kind === "desktop";
  return (
    <li className={`shrink-0 snap-start ${duplicate ? "ns-marquee-dup" : ""}`}>
      <div
        className={`overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 ${
          desktop ? "h-[150px] w-[240px]" : "h-[150px] w-[70px]"
        }`}
      >
        <Image
          src={`/shots/${tile.slug}-${tile.kind}.webp`}
          alt=""
          width={desktop ? 2560 : 780}
          height={desktop ? 1720 : 1688}
          sizes={desktop ? "240px" : "70px"}
          className="h-full w-full object-cover object-top"
        />
      </div>
      {desktop ? (
        <p className="mt-2 max-w-[240px] text-xs leading-snug text-slate-500">
          <span className="block truncate font-medium text-slate-700">{business.name}</span>
          Example · fictional business
        </p>
      ) : (
        <p className="mt-2 text-xs leading-snug text-slate-500">Phone</p>
      )}
    </li>
  );
}

export function Marquee() {
  return (
    <section
      aria-labelledby="built-with-title"
      className="border-y border-slate-200 bg-surface py-8"
    >
      <div className={`${container} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`}>
        <h2
          id="built-with-title"
          className="text-[13px] font-semibold tracking-[0.02em] text-slate-500"
        >
          Built with No Sweat
        </h2>
        <Link
          href="#examples"
          className={`inline-flex min-h-11 items-center gap-1.5 text-sm ${textLink}`}
        >
          See examples
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      {/* Duas cópias iguais (cada uma com os 6 cartões duas vezes, mais larga que a tela):
          a animação desliza -50% e recomeça sem emenda. O pr-6 fecha o vão da emenda. */}
      <div
        aria-hidden="true"
        className="ns-marquee mt-4 flex snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="ns-marquee-track flex w-max gap-6 pr-6">
          {[0, 1, 2, 3].flatMap((copy) =>
            TILES.map((tile) => (
              <MarqueeTile
                key={`${copy}-${tile.slug}-${tile.kind}`}
                tile={tile}
                duplicate={copy > 0}
              />
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
