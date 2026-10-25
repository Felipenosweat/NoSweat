import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, isOwnerPhoto, renderSections, type SiteModel } from "./model";
import {
  AddressBlock,
  FaqList,
  HeroActions,
  HoursTable,
  MobileCallBar,
  PeopleList,
  PhotoFrame,
  ContactSection,
  SimpleFooter,
  SiteHeader,
  Wrap,
  sectionY,
} from "./shared";

const h2 =
  "font-ns-heading text-4xl leading-[1.05] font-ns-display tracking-[-0.02em] text-balance @min-[40rem]:text-5xl";

/**
 * Composição MODULAR (grade de linhas finas, como um catálogo impresso): o topo divide a tela
 * entre o título e a foto; embaixo, células separadas por fios com horário, telefone e fatos.
 * Serviços em células de tamanhos diferentes (o primeiro mais largo), perguntas em duas
 * colunas e o contato em duas células. Sem cartões arredondados nem blocos de cor chapada:
 * isso era o que mais dava cara de modelo pronto.
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
            <Wrap className={`${grid} @5xl:grid-cols-5`}>
              <div className={`${cell} @5xl:col-span-3`}>
                <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
                <p className="mt-8 max-w-[44ch] font-ns-heading text-[length:clamp(1.375rem,2.4cqw,1.875rem)] leading-[1.35] font-ns-display text-pretty whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && (
                  <PeopleList people={section.people} radius={RADIUS} className="mt-12" />
                )}
              </div>
              {isOwnerPhoto(section.image) ? (
                <PhotoFrame
                  image={section.image}
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
              <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
              <ul
                className={`mt-12 ${grid} @3xl:grid-cols-2 ${section.items.length % 3 === 0 ? "@5xl:grid-cols-3" : ""}`}
              >
                {section.items.map((item, i) => (
                  <li
                    key={`${item.author}-${i}`}
                    className={`${cell} ${section.items.length % 2 === 1 && i === section.items.length - 1 && section.items.length % 3 !== 0 ? "@3xl:col-span-2" : ""}`}
                  >
                    <figure className="h-full">
                      <blockquote className="font-ns-heading text-xl leading-snug font-ns-display text-pretty">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-6 text-[0.6875rem] tracking-[0.16em] text-ns-muted uppercase">
                        {item.author}
                      </figcaption>
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
            radius={RADIUS}
          />
        );
      case "faq":
        return (
          <section key={key} id={id} className={`scroll-mt-28 ${sectionY}`}>
            <Wrap>
              <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
              <FaqList data={section} className="mt-12" />
            </Wrap>
          </section>
        );
      case "contact":
        return (
          <ContactSection
            key={key}
            id={id}
            model={model}
            data={section}
            endpoint={contactEndpoint}
          />
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div id={anchors ? "top" : undefined} className="flex min-h-full flex-col">
      <SiteHeader model={model} radius={RADIUS} />
      <main id={anchors ? "main" : undefined} className="flex-1">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <SimpleFooter
        model={model}
        bigName
        className="mt-(--ns-section-y) border-t border-ns-border"
      />
      <MobileCallBar model={model} radius={RADIUS} />
    </div>
  );
}

/** Um raio só, quase reto, para botões, fotos e o formulário. */
const RADIUS = "rounded-sm";

/**
 * Grade de fios: as células ficam lado a lado e o fio aparece entre elas (o fundo da grade é a
 * cor do fio e cada célula pinta o fundo da página por cima, com 1px de folga).
 */
const grid = "grid gap-px border border-ns-border bg-ns-border";
const cell = "bg-ns-background p-7 @min-[40rem]:p-10";

function BentoHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business, where, phoneHref } = model;
  const hours = business.hours?.length ? business.hours : null;

  // Células de baixo (só as que têm dado real); dividem a largura toda entre si.
  const bottom: ReactNode[] = [];
  if (hours || where) {
    bottom.push(
      <div className={`${cell} h-full`}>
        <p className={label}>{hours ? "Hours" : business.serviceArea ? "Serving" : "Based in"}</p>
        {hours ? (
          <HoursTable hours={hours} className="mt-4" />
        ) : (
          <p className="mt-4 text-lg">{where}</p>
        )}
      </div>,
    );
  }
  if (business.phone && phoneHref) {
    bottom.push(
      <a
        href={phoneHref}
        className={`${cell} group flex h-full flex-col justify-between gap-6 transition-colors hover:bg-ns-surface focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ns-primary motion-reduce:transition-none`}
      >
        <span className={label}>Call</span>
        <span className="font-ns-heading text-[length:clamp(1.5rem,2.6cqw,2rem)] font-ns-display whitespace-nowrap tabular-nums">
          {business.phone}
        </span>
      </a>,
    );
  }
  if (business.highlights?.length) {
    bottom.push(
      <div className={`${cell} h-full`}>
        <p className={label}>Good to know</p>
        <ul className="mt-4 space-y-1.5">
          {business.highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
      </div>,
    );
  }

  return (
    <section className="pt-8 @min-[40rem]:pt-12">
      <Wrap>
        <div className={`${grid} @3xl:grid-cols-2 @5xl:grid-cols-6`}>
          <div className={`${cell} @3xl:col-span-2 @5xl:col-span-6`}>
            {where && (
              <p className={label}>{[business.category, where].filter(Boolean).join(", ")}</p>
            )}
            <h1 className="mt-8 font-ns-heading text-[length:calc(clamp(3rem,9cqw,9.5rem)*var(--ns-display-scale))] leading-[0.88] font-ns-display tracking-[-0.04em] text-balance [overflow-wrap:break-word]">
              {data.title}
            </h1>
          </div>
          <div
            className={`${cell} flex flex-col justify-between gap-10 @3xl:col-span-2 ${data.image ? "@5xl:col-span-2" : "@5xl:col-span-6"}`}
          >
            <p className="max-w-md text-lg leading-relaxed text-pretty text-ns-muted">
              {data.subtitle}
            </p>
            <HeroActions model={model} radius={RADIUS} />
          </div>
          {data.image && (
            <PhotoFrame
              image={data.image}
              eager
              sizes="(min-width: 1152px) 768px, (min-width: 1024px) 66vw, 100vw"
              className="relative aspect-[4/3] bg-ns-background @3xl:col-span-2 @3xl:aspect-[16/9] @5xl:col-span-4 @5xl:aspect-[16/10]"
            />
          )}
          {bottom.map((item, i) => (
            <div key={i} className={`${bottomSpan[bottom.length] ?? ""}`}>
              {item}
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}

const label = "text-[0.6875rem] tracking-[0.18em] text-ns-muted uppercase";

/** Largura de cada célula da linha de baixo do topo (grade de 6 colunas), pela quantidade. */
const bottomSpan: Record<number, string> = {
  1: "@3xl:col-span-2 @5xl:col-span-6",
  2: "@3xl:col-span-1 @5xl:col-span-3",
  3: "@3xl:col-span-2 @5xl:col-span-2",
};

/**
 * Células de serviço sem buracos na grade: o primeiro e às vezes o último ficam largos para
 * fechar as linhas (3 colunas no computador, 2 no tablet).
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
        <h2 className={`ns-rise ${h2}`}>{model.titleOf(data)}</h2>
        <ul className={`mt-12 ${grid} @3xl:grid-cols-2 @5xl:grid-cols-3`}>
          {data.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className={`${cell} flex flex-col ${spanFor(index, data.items.length)}`}
            >
              <span className="text-xs text-ns-muted tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                className={`mt-6 font-ns-heading font-ns-display text-balance [overflow-wrap:anywhere] ${index === 0 ? "text-3xl" : "text-2xl"}`}
              >
                {item.name}
              </h3>
              <p className="mt-3 max-w-[46ch] leading-relaxed text-ns-muted">{item.description}</p>
              {(item.price || item.detail) && (
                <p className="mt-auto flex flex-wrap gap-x-3 pt-6 text-sm tabular-nums">
                  {item.price && <span className="font-medium">{item.price}</span>}
                  {item.detail && <span className="text-ns-muted">{item.detail}</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

/** Sem foto do dono no "quem somos": uma célula com onde fica e o horário (se houver). */
function AboutFacts({ model }: { model: SiteModel }) {
  const hours = model.business.hours?.length ? model.business.hours : null;
  if (!hours && !model.address && !model.where) return null;
  return (
    <div className={`${cell} @5xl:col-span-2`}>
      {model.address ? (
        <>
          <p className={label}>Find us</p>
          <AddressBlock model={model} className="mt-4 text-lg" />
        </>
      ) : (
        model.where && (
          <>
            <p className={label}>{model.areaLabel}</p>
            <p className="mt-4 text-lg">{model.where}</p>
          </>
        )
      )}
      {hours && (
        <>
          <p className={`mt-10 ${label}`}>Hours</p>
          <HoursTable hours={hours} className="mt-4" />
        </>
      )}
    </div>
  );
}
