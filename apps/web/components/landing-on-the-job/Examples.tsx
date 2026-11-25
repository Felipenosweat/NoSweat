import Image from "next/image";
import Link from "next/link";
import { EXAMPLES_BODY, EXAMPLES_TITLE, exampleSites, type ExampleSite } from "./content";

// 3. "Como vai ficar o meu site?" Três sites de exemplo (negócios inventados, avisado em cada
// legenda) em capturas reais: a de computador grande e a do celular por cima. Um na frente,
// grande; dois menores ao lado, em alturas diferentes, para não virar três cartões iguais.
// Nome, ramo e cidade vêm das fixtures (content.ts → exampleSites).

export function Examples() {
  const [lead, ...rest] = exampleSites();
  return (
    <section
      id="examples"
      aria-labelledby="examples-title"
      className="otj-grid relative scroll-mt-16 bg-surface py-16 md:py-24 lg:py-32"
    >
      {/* Âncoras antigas (/#looks, /#story) dos cabeçalhos e rodapés das outras páginas. */}
      <span id="looks" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <span id="story" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <h2 id="examples-title" className="otj-display otj-h2 col-[2/14] text-ink lg:col-[2/9]">
        {EXAMPLES_TITLE}
      </h2>
      <p className="col-[2/14] mt-5 max-w-[46ch] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px] lg:col-[9/14] lg:mt-0 lg:self-end">
        {EXAMPLES_BODY}
      </p>

      <div className="col-[2/14] mt-12 grid gap-14 md:mt-16 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-16">
        {lead && (
          <div className="lg:col-span-8">
            <ExampleFigure site={lead} size="lead" />
          </div>
        )}
        <div className="grid gap-14 md:grid-cols-2 md:gap-6 lg:col-span-4 lg:grid-cols-1 lg:gap-16 lg:pt-20">
          {rest.map((site) => (
            <ExampleFigure key={site.slug} site={site} size="small" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExampleFigure({ site, size }: { site: ExampleSite; size: "lead" | "small" }) {
  const lead = size === "lead";
  return (
    <Link
      href={`/examples/${site.slug}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <div className="relative pr-[14%] pb-[10%]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_12px_32px_-16px_rgb(7_27_51/.25)]">
          <Image
            src={`/landing/signature/${site.slug}-d.webp`}
            alt=""
            fill
            sizes={
              lead
                ? "(min-width: 1024px) 58vw, 90vw"
                : "(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 90vw"
            }
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
          />
        </div>
        <div
          className={`absolute right-0 bottom-0 aspect-[640/1385] overflow-hidden rounded-xl border-4 border-ink bg-ink shadow-[0_18px_40px_-16px_rgb(7_27_51/.5)] ${
            lead ? "w-[24%]" : "w-[28%]"
          }`}
        >
          <Image
            src={`/landing/signature/${site.slug}-m.webp`}
            alt=""
            fill
            sizes={lead ? "(min-width: 1024px) 14vw, 24vw" : "(min-width: 1024px) 8vw, 28vw"}
            className="object-cover object-top"
          />
        </div>
      </div>
      <p className={`mt-4 leading-snug text-pretty ${lead ? "text-[17px]" : "text-[15px]"}`}>
        <span className="font-semibold text-ink underline-offset-4 group-hover:underline">
          {site.name}
        </span>
        <span className="text-slate-600">
          {" "}
          · {site.trade}, {site.city} · <span className="whitespace-nowrap">Made-up business</span>
        </span>
      </p>
    </Link>
  );
}
