import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  AboutPhoto,
  FaqList,
  HeroActions,
  HighlightList,
  MobileCallBar,
  PeopleList,
  PhotoFrame,
  PriceList,
  ServiceMarquee,
  ContactSection,
  SimpleFooter,
  SiteHeader,
  Wrap,
  hasPriceList,
  sectionY,
} from "./shared";

/** Revista: cantos retos em tudo (botões, fotos e formulário). */
const RADIUS = "rounded-none";

const h2 =
  "font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl";

/**
 * Composição EDITORIAL (revista): título enorme em largura total, texto e botões numa linha
 * abaixo, foto larga com legenda, serviços como sumário numerado (ou cardápio de preços),
 * galeria em folha de contato, perguntas com o título fixo ao lado e o nome do negócio grande
 * no rodapé. Linhas finas no lugar de cards.
 */
export function EditorialComposition({
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
        return <EditorialHero key={key} model={model} data={section} />;
      case "services":
        return (
          <div key={key}>
            <ServiceMarquee model={model} className="border-y border-ns-border" />
            <EditorialServices id={id} model={model} data={section} />
          </div>
        );
      case "about":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <div className="@5xl:col-span-4">
                <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
                <AboutPhoto data={section} radius={RADIUS} className="mt-10" />
              </div>
              <div className="@5xl:col-span-7 @5xl:col-start-6">
                <p className="ns-rise font-ns-heading text-[length:clamp(1.625rem,2.9cqw,2.75rem)] leading-[1.25] font-ns-display tracking-[-0.015em] text-pretty whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && (
                  <PeopleList
                    people={section.people}
                    radius={RADIUS}
                    className="mt-14 border-t border-ns-border pt-10"
                  />
                )}
              </div>
            </Wrap>
          </section>
        );
      case "testimonials":
        return <EditorialQuotes key={key} id={id} model={model} data={section} />;
      case "gallery":
        return (
          <Gallery
            key={key}
            id={id}
            data={section}
            defaultTitle={model.titleOf(section)}
            variant="sheet"
            radius={RADIUS}
          />
        );
      case "faq":
        return (
          <section key={key} id={id} className={`scroll-mt-24 ${sectionY}`}>
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <h2
                className={`ns-rise ${h2} @5xl:sticky @5xl:top-28 @5xl:col-span-4 @5xl:self-start`}
              >
                {model.titleOf(section)}
              </h2>
              <FaqList data={section} className="@5xl:col-span-7 @5xl:col-start-6" />
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
      <SimpleFooter model={model} bigName className="border-t border-ns-border" />
      <MobileCallBar model={model} radius={RADIUS} />
    </div>
  );
}

function EditorialHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const kicker = [model.business.category, model.where].filter(Boolean).join(" · ");
  return (
    <section className="pt-12 pb-(--ns-section-y) @min-[40rem]:pt-16 @5xl:pt-20">
      <Wrap>
        {kicker && (
          <p className="text-sm font-semibold tracking-[0.18em] text-ns-primary uppercase">
            {kicker}
          </p>
        )}
        <h1 className="mt-6 max-w-[14ch] font-ns-heading text-[length:calc(clamp(3.25rem,11cqw,11.5rem)*var(--ns-display-scale))] leading-[0.88] font-ns-display tracking-[-0.04em] text-balance [overflow-wrap:anywhere]">
          {data.title}
        </h1>
        <div className="mt-10 grid gap-8 border-t border-ns-border pt-8 @5xl:grid-cols-12 @5xl:items-end">
          <p className="max-w-xl text-lg leading-relaxed text-pretty text-ns-muted @min-[40rem]:text-xl @5xl:col-span-6">
            {data.subtitle}
          </p>
          <div className="@5xl:col-span-6 @5xl:justify-self-end">
            <HeroActions model={model} radius={RADIUS} />
          </div>
        </div>
        <HighlightList highlights={model.business.highlights} className="mt-8 text-ns-muted" />
      </Wrap>
      {data.image && (
        <Wrap wide className="mt-14 @5xl:mt-20">
          <PhotoFrame
            image={data.image}
            eager
            credit="below"
            sizes="(min-width: 1280px) 1216px, 100vw"
            imgClassName="aspect-[4/3] w-full object-cover @min-[40rem]:aspect-[16/9] @5xl:aspect-[21/9]"
          />
        </Wrap>
      )}
    </section>
  );
}

function EditorialServices({
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
    <section id={id} className={`scroll-mt-24 ${sectionY}`}>
      <Wrap>
        <div className="flex flex-col gap-3 @5xl:flex-row @5xl:items-end @5xl:justify-between">
          <h2 className={`ns-rise ${h2}`}>{model.titleOf(data)}</h2>
          {model.where && !hasPriceList(data) && (
            <p className="text-ns-muted">
              {model.areaLabel} {model.where}
            </p>
          )}
        </div>
        {hasPriceList(data) ? (
          <PriceList data={data} className="mt-12" />
        ) : (
          <ol className="mt-12 border-b border-ns-border">
            {data.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="grid gap-3 border-t border-ns-border py-8 @3xl:grid-cols-12 @3xl:gap-8"
              >
                <span className="font-ns-heading text-sm font-semibold text-ns-primary tabular-nums @3xl:col-span-1 @3xl:pt-2">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-ns-heading text-2xl leading-snug font-ns-display text-balance [overflow-wrap:anywhere] @min-[40rem]:text-3xl @3xl:col-span-5">
                  {item.name}
                </h3>
                <div className="max-w-[52ch] @3xl:col-span-6 @3xl:pt-1.5">
                  <p className="leading-relaxed text-ns-muted">{item.description}</p>
                  {item.detail && (
                    <p className="mt-2 text-sm font-medium tabular-nums">{item.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Wrap>
    </section>
  );
}

function EditorialQuotes({
  id,
  model,
  data,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"testimonials">;
}) {
  if (data.items.length === 0) return null;
  return (
    <section id={id} className={`scroll-mt-24 bg-ns-surface ${sectionY}`}>
      <Wrap>
        <h2 className="ns-rise text-sm font-semibold tracking-[0.18em] text-ns-muted uppercase">
          {model.titleOf(data)}
        </h2>
        <ul className="mt-12 space-y-16">
          {data.items.map((item, index) => (
            <li key={`${item.author}-${index}`}>
              <figure className="max-w-4xl">
                <blockquote className="font-ns-heading text-3xl leading-snug text-pretty @min-[40rem]:text-4xl">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm font-semibold tracking-wider text-ns-muted uppercase">
                  {item.author}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}
