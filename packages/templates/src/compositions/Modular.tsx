import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { PhoneIcon } from "../components/icons";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, isOwnerPhoto, renderSections, type SiteModel } from "./model";
import {
  AddressBlock,
  ContactFormBlock,
  ContactLines,
  HeroActions,
  HighlightList,
  HoursTable,
  MobileCallBar,
  NavLinks,
  PeopleList,
  PhotoFrame,
  SimpleFooter,
  Wrap,
  sectionY,
} from "./shared";

const h2 = "font-ns-heading text-4xl font-bold tracking-tight text-balance @min-[40rem]:text-5xl";

/**
 * Composição MODULAR (grade de blocos): o topo é uma grade com o título, a foto, o horário ou a
 * área e um bloco de ligar, cada um no seu quadro. Serviços em blocos de tamanhos diferentes
 * (o primeiro em destaque), perguntas em quadros lado a lado e o contato em dois blocos.
 */
export function ModularComposition({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    switch (section.type) {
      case "hero":
        return <BentoHero key={key} model={model} data={section} />;
      case "services":
        return <BentoServices key={key} id={id} model={model} data={section} />;
      case "about":
        return (
          <section key={key} id={id} className={`scroll-mt-28 ${sectionY}`}>
            <Wrap className="grid gap-3 @5xl:grid-cols-5">
              <div className={`${tile} bg-ns-surface @5xl:col-span-3`}>
                <h2 className={h2}>{model.titleOf(section)}</h2>
                <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-pretty whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && (
                  <PeopleList people={section.people} radius="rounded-xl" className="mt-10" />
                )}
              </div>
              {isOwnerPhoto(section.image) ? (
                <PhotoFrame
                  image={section.image}
                  radius="rounded-[1.75rem]"
                  sizes="(min-width: 1024px) 440px, 100vw"
                  className="relative aspect-[4/3] @5xl:col-span-2 @5xl:aspect-auto @5xl:min-h-80"
                />
              ) : (
                <AboutFacts model={model} />
              )}
            </Wrap>
          </section>
        );
      case "testimonials":
        if (section.items.length === 0) return null;
        return (
          <section key={key} id={id} className={`scroll-mt-28 ${sectionY}`}>
            <Wrap>
              <h2 className={h2}>{model.titleOf(section)}</h2>
              <ul className="mt-10 grid gap-3 @3xl:grid-cols-2 @5xl:grid-cols-3">
                {section.items.map((item, i) => (
                  <li key={`${item.author}-${i}`}>
                    <figure className="h-full rounded-[1.75rem] bg-ns-surface p-7">
                      <blockquote className="leading-relaxed text-pretty">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-5 font-semibold">{item.author}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </Wrap>
          </section>
        );
      case "gallery":
        return (
          <Gallery
            key={key}
            id={id}
            data={section}
            defaultTitle={model.titleOf(section)}
            variant="tiles"
            radius="rounded-[1.75rem]"
          />
        );
      case "faq":
        return (
          <section key={key} id={id} className={`scroll-mt-28 ${sectionY}`}>
            <Wrap>
              <h2 className={h2}>{model.titleOf(section)}</h2>
              <div className="mt-10 grid gap-3 @3xl:grid-cols-2">
                {section.items.map((item, i) => (
                  <details
                    key={`${item.q}-${i}`}
                    className="group rounded-[1.75rem] bg-ns-surface px-6 open:bg-ns-background open:ring-1 open:ring-ns-border"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ns-background text-lg leading-none transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                      >
                        +
                      </span>
                    </summary>
                    <p className="pb-6 leading-relaxed text-ns-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </Wrap>
          </section>
        );
      case "contact":
        return (
          <section key={key} id={id} className={`scroll-mt-28 ${sectionY}`}>
            <Wrap className="grid gap-3 @5xl:grid-cols-5">
              <div className="rounded-[1.75rem] bg-ns-primary p-8 text-ns-on-primary @min-[40rem]:p-10 @5xl:col-span-2">
                <h2 className="font-ns-heading text-4xl font-bold tracking-tight text-balance">
                  {model.titleOf(section)}
                </h2>
                <ContactLines model={model} className="mt-10" />
              </div>
              {section.showForm && (
                <div className="rounded-[1.75rem] bg-ns-surface p-6 @min-[40rem]:p-10 @5xl:col-span-3">
                  <ContactFormBlock
                    data={section}
                    model={model}
                    endpoint={contactEndpoint}
                    radius="lg"
                    framed={false}
                  />
                </div>
              )}
            </Wrap>
          </section>
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div id={anchors ? "top" : undefined} className="flex min-h-full flex-col">
      <header className="sticky top-3 z-40 px-3 pt-3">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-ns-border bg-ns-background/90 pr-2 pl-6 backdrop-blur">
          <a
            href="#top"
            className="min-w-0 truncate font-ns-heading text-lg font-bold tracking-tight"
          >
            {model.business.name}
          </a>
          <div className="flex items-center gap-6">
            <NavLinks
              model={model}
              className="hidden @5xl:block"
              linkClassName="text-ns-muted hover:text-ns-text"
            />
            {model.phoneHref && model.business.phone && (
              <a
                href={model.phoneHref}
                className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-ns-primary px-4 font-semibold text-ns-on-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary motion-reduce:transition-none"
              >
                <PhoneIcon className="size-5 shrink-0" />
                <span className="sr-only whitespace-nowrap @min-[40rem]:not-sr-only">
                  {model.business.phone}
                </span>
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{renderSections(spec, render, editable, selectedSection)}</main>
      <SimpleFooter model={model} className="mt-(--ns-section-y) bg-ns-surface" />
      <MobileCallBar model={model} radius="rounded-xl" />
    </div>
  );
}

const tile = "rounded-[1.75rem] p-7 @min-[40rem]:p-9";

/** Largura de cada bloco da linha de baixo do topo (grade de 6 colunas), pela quantidade. */
const bottomSpan: Record<number, string> = {
  1: "@5xl:col-span-6",
  2: "@3xl:col-span-1 @5xl:col-span-3",
  3: "@5xl:col-span-2",
};

function BentoHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business, where, phoneHref } = model;
  const hours = business.hours?.length ? business.hours : null;

  // Blocos da linha de baixo (só os que têm dado real); dividem a largura toda entre si.
  const bottom: ReactNode[] = [];
  if (hours || where) {
    bottom.push(
      <div className={`${tile} h-full bg-ns-primary text-ns-on-primary`}>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase">
          {hours ? "Hours" : business.serviceArea ? "Serving" : "Based in"}
        </p>
        {hours ? (
          <HoursTable hours={hours} className="mt-4" />
        ) : (
          <p className="mt-4 text-2xl font-semibold">{where}</p>
        )}
      </div>,
    );
  }
  if (business.phone && phoneHref) {
    bottom.push(
      <a
        href={phoneHref}
        className={`${tile} group flex h-full flex-col justify-between gap-6 bg-ns-text text-ns-background transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary motion-reduce:transition-none`}
      >
        <span className="text-xs font-semibold tracking-[0.18em] uppercase">Call us</span>
        <span className="flex items-center justify-between gap-4">
          <span className="text-2xl font-semibold whitespace-nowrap">{business.phone}</span>
          <PhoneIcon className="size-6 shrink-0 transition-transform duration-200 group-hover:rotate-12 motion-reduce:transition-none" />
        </span>
      </a>,
    );
  }
  if (business.highlights?.length) {
    bottom.push(
      <div className={`${tile} h-full bg-ns-surface`}>
        <HighlightList highlights={business.highlights} className="flex-col" />
      </div>,
    );
  }

  return (
    <section className="pt-6 @min-[40rem]:pt-10">
      <Wrap className="grid gap-3 @3xl:grid-cols-2 @5xl:grid-cols-6">
        <div
          className={`${tile} flex flex-col justify-end bg-ns-surface @3xl:col-span-2 ${data.image ? "@5xl:col-span-4" : "@5xl:col-span-6"}`}
        >
          {where && <p className="text-sm font-semibold text-ns-primary">{where}</p>}
          <h1 className="mt-4 max-w-[18ch] font-ns-heading text-[length:clamp(2.5rem,6cqw,4.75rem)] leading-[1] font-bold tracking-tight text-balance [overflow-wrap:anywhere]">
            {data.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ns-muted">
            {data.subtitle}
          </p>
          <HeroActions model={model} className="mt-9" />
        </div>
        {data.image && (
          <PhotoFrame
            image={data.image}
            eager
            sizes="(min-width: 1024px) 380px, 100vw"
            className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] @3xl:col-span-2 @3xl:aspect-[16/9] @5xl:col-span-2 @5xl:aspect-auto @5xl:min-h-[26rem] [&_.ns-photo]:rounded-[1.75rem]"
          />
        )}
        {bottom.map((item, i) => (
          <div key={i} className={`${bottomSpan[bottom.length] ?? ""}`}>
            {item}
          </div>
        ))}
      </Wrap>
    </section>
  );
}

/**
 * Blocos de serviço sem buracos na grade: o primeiro (em destaque) e às vezes o último ficam
 * largos para fechar as linhas (3 colunas no computador, 2 no tablet).
 */
function spanFor(index: number, count: number): string {
  const classes: string[] = [];
  const last = index === count - 1;
  if (index === 0 && count % 2 === 1 && count > 1) classes.push("@3xl:col-span-2");
  if (count % 3 !== 0 && count > 1 && (index === 0 || (count % 3 === 1 && last))) {
    classes.push("@5xl:col-span-2");
  } else if (index === 0 && count % 2 === 1) {
    classes.push("@5xl:col-span-1");
  }
  return classes.join(" ");
}

function BentoServices({
  id,
  model,
  data,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"services">;
}) {
  if (data.items.length === 0) return null;
  return (
    <section id={id} className={`scroll-mt-28 ${sectionY}`}>
      <Wrap>
        <h2 className={h2}>{model.titleOf(data)}</h2>
        <ul className="mt-10 grid gap-3 @3xl:grid-cols-2 @5xl:grid-cols-3">
          {data.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className={`${tile} ${index === 0 ? "bg-ns-text text-ns-background" : "bg-ns-surface"} ${spanFor(index, data.items.length)}`}
            >
              <h3
                className={`font-ns-heading font-bold text-balance [overflow-wrap:anywhere] ${index === 0 ? "text-3xl" : "text-xl"}`}
              >
                {item.name}
              </h3>
              <p className={`mt-3 leading-relaxed ${index === 0 ? "opacity-85" : "text-ns-muted"}`}>
                {item.description}
              </p>
              {(item.price || item.detail) && (
                <p className="mt-5 flex flex-wrap gap-x-3 text-sm font-semibold tabular-nums">
                  {item.price && <span>{item.price}</span>}
                  {item.detail && <span className="opacity-75">{item.detail}</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

/** Sem foto do dono no "quem somos": um bloco com onde fica e o horário (se houver). */
function AboutFacts({ model }: { model: SiteModel }) {
  const hours = model.business.hours?.length ? model.business.hours : null;
  if (!hours && !model.address && !model.where) return null;
  return (
    <div className={`${tile} bg-ns-primary text-ns-on-primary @5xl:col-span-2`}>
      {model.address ? (
        <>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase">Find us</p>
          <AddressBlock model={model} className="mt-4 text-lg" />
        </>
      ) : (
        model.where && (
          <>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase">{model.areaLabel}</p>
            <p className="mt-4 text-2xl font-semibold">{model.where}</p>
          </>
        )
      )}
      {hours && (
        <>
          <p className="mt-8 text-xs font-semibold tracking-[0.18em] uppercase">Hours</p>
          <HoursTable hours={hours} className="mt-4" />
        </>
      )}
    </div>
  );
}
