import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  AboutPhoto,
  ContactFormBlock,
  ContactLines,
  FactLine,
  HighlightList,
  FaqList,
  HeaderAction,
  HeroActions,
  MobileCallBar,
  NavLinks,
  PeopleList,
  PhotoFrame,
  PriceList,
  ServiceAreaList,
  SimpleFooter,
  Wrap,
  areaPlaces,
  factsFor,
  focus,
  hasPriceList,
  sectionY,
  type Fact,
} from "./shared";

/** Um raio só para botões, fotos e formulário; faixas e linhas ficam retas. */
const RADIUS = "rounded-md";

const h2 =
  "max-w-[20ch] font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl";

/**
 * Composição SERVICE-LED (prestador de serviço: encanador, eletricista, limpeza...).
 * O telefone está sempre à vista (cabeçalho, topo, faixa de fatos, contato e barra do celular).
 * Topo em duas colunas com a foto, faixa de fatos logo abaixo (horário, área, telefone, selos
 * do dono), serviços em linhas sem ícones, lista das cidades atendidas antes do contato e o
 * telefone grande no contato. Uma cor de ação só: a primária é "ligar".
 */
export function ServiceLedComposition({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);
  const hasContact = spec.sections.some((s) => s.type === "contact");

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    switch (section.type) {
      case "hero":
        return <ServiceHero key={key} model={model} data={section} />;
      case "services":
        return <ServiceRows key={key} id={id} model={model} data={section} />;
      case "about":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-y border-ns-border bg-ns-surface ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12 @5xl:gap-12">
              <div className="@5xl:col-span-5">
                <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
                <AboutPhoto data={section} radius={RADIUS} className="mt-8" />
              </div>
              <div className="@5xl:col-span-7">
                <p className="max-w-[60ch] text-lg leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && <PeopleList people={section.people} className="mt-10" />}
              </div>
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
            variant="grid"
            radius={RADIUS}
          />
        );
      case "testimonials":
        if (section.items.length === 0) return null;
        return (
          <section key={key} id={id} className={`scroll-mt-24 ${sectionY}`}>
            <Wrap>
              <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
              <ul className="mt-10 grid gap-x-12 gap-y-10 @3xl:grid-cols-2">
                {section.items.map((item, i) => (
                  <li key={`${item.author}-${i}`}>
                    <figure className="border-l-2 border-ns-primary pl-6">
                      <blockquote className="text-lg leading-relaxed text-pretty">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-4 font-semibold">{item.author}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </Wrap>
          </section>
        );
      case "faq":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <h2 className={`ns-rise ${h2} @5xl:col-span-4`}>{model.titleOf(section)}</h2>
              <FaqList data={section} className="@5xl:col-span-8" />
            </Wrap>
          </section>
        );
      case "contact":
        return (
          <div key={key}>
            <AreaBand model={model} />
            <ServiceContact id={id} model={model} data={section} endpoint={contactEndpoint} />
          </div>
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div id={anchors ? "top" : undefined} className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-background/95 backdrop-blur">
        <Wrap className="flex h-16 items-center justify-between gap-4 @min-[40rem]:h-20">
          <a href="#top" className={`min-w-0 ${focus}`}>
            <span className="line-clamp-2 block font-ns-heading text-lg leading-tight font-ns-display tracking-tight [overflow-wrap:anywhere] @min-[40rem]:text-xl">
              {model.business.name}
            </span>
            {model.business.category && (
              <span className="hidden truncate text-xs text-ns-muted @min-[40rem]:block">
                {model.business.category}
              </span>
            )}
          </a>
          <div className="flex shrink-0 items-center gap-7">
            <NavLinks
              model={model}
              className="hidden @5xl:block"
              linkClassName="text-ns-muted hover:text-ns-text"
            />
            <HeaderAction model={model} radius={RADIUS} filled />
          </div>
        </Wrap>
      </header>
      <main id={anchors ? "main" : undefined} className="flex-1">
        {renderSections(spec, render, editable, selectedSection)}
        {!hasContact && <AreaBand model={model} />}
      </main>
      <SimpleFooter model={model} className="bg-ns-text text-ns-background" />
      <MobileCallBar model={model} radius={RADIUS} />
    </div>
  );
}

function ServiceHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business, where } = model;
  const kicker = [business.category, where].filter(Boolean).join(" · ");
  const facts: Fact[] = factsFor(model, { hours: "line", price: false });
  return (
    <section>
      <Wrap className="grid gap-10 pt-10 pb-12 @5xl:grid-cols-12 @5xl:items-center @5xl:gap-12 @5xl:pt-16 @5xl:pb-16">
        <div className={data.image ? "@5xl:col-span-7" : "@5xl:col-span-10"}>
          {kicker && (
            <p className="text-xs font-semibold tracking-[0.18em] text-ns-muted uppercase">
              {kicker}
            </p>
          )}
          <h1 className="mt-4 font-ns-heading text-[length:calc(clamp(2.75rem,7cqw,6rem)*var(--ns-display-scale))] leading-[0.95] font-ns-display tracking-[-0.03em] text-balance [overflow-wrap:anywhere]">
            {data.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ns-muted @min-[40rem]:text-xl">
            {data.subtitle}
          </p>
          <HeroActions model={model} radius={RADIUS} className="mt-8" />
          <HighlightList highlights={business.highlights} className="mt-6 text-ns-muted" />
        </div>
        {data.image && (
          <PhotoFrame
            image={data.image}
            eager
            radius={RADIUS}
            sizes="(min-width: 1152px) 440px, (min-width: 1024px) 40vw, 100vw"
            className="relative aspect-[4/3] @5xl:col-span-5 @5xl:aspect-[4/5]"
          />
        )}
      </Wrap>
      {facts.length > 0 && (
        <div className="border-y border-ns-border">
          <Wrap>
            <FactLine facts={facts} className="py-6 text-ns-muted [&_dd]:text-ns-text" />
          </Wrap>
        </div>
      )}
    </section>
  );
}

function ServiceRows({
  id,
  model,
  data,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"services">;
}) {
  if (data.items.length === 0) return null;
  const grouped = data.items.some((item) => item.group?.trim());
  return (
    <section id={id} className={`scroll-mt-24 ${sectionY}`}>
      <Wrap>
        <h2 className={`ns-rise ${h2}`}>{model.titleOf(data)}</h2>
        {grouped && hasPriceList(data) ? (
          <PriceList data={data} className="mt-10" />
        ) : (
          <ul className="mt-10 border-t-2 border-ns-text">
            {data.items.map((item, index) => {
              const meta = [item.detail, item.price].filter(Boolean).join(" · ");
              return (
                <li
                  key={`${item.name}-${index}`}
                  className="grid gap-2 border-b border-ns-border py-6 @3xl:grid-cols-12 @3xl:gap-8"
                >
                  <h3 className="font-ns-heading text-xl leading-snug font-ns-display text-balance [overflow-wrap:anywhere] @3xl:col-span-4">
                    {item.name}
                  </h3>
                  <p
                    className={`max-w-[60ch] leading-relaxed text-ns-muted ${meta ? "@3xl:col-span-5" : "@3xl:col-span-8"}`}
                  >
                    {item.description}
                  </p>
                  {meta && (
                    <p className="text-sm font-semibold tabular-nums @3xl:col-span-3 @3xl:text-right">
                      {meta}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Wrap>
    </section>
  );
}

/** Faixa escura com as cidades atendidas (só quando o dono citou mais de uma). */
function AreaBand({ model }: { model: SiteModel }) {
  if (areaPlaces(model.business.serviceArea).places.length < 2) return null;
  return (
    <div className="bg-ns-text py-14 text-ns-background">
      <Wrap>
        <ServiceAreaList model={model} />
      </Wrap>
    </div>
  );
}

function ServiceContact({
  id,
  model,
  data,
  endpoint,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"contact">;
  endpoint?: string;
}) {
  const { business, phoneHref } = model;
  return (
    <section id={id} className={`scroll-mt-24 ${sectionY}`}>
      <Wrap className={`grid gap-12 ${data.showForm ? "@5xl:grid-cols-12" : ""}`}>
        <div className={data.showForm ? "@5xl:col-span-5" : ""}>
          <h2 className={`ns-rise ${h2}`}>{model.titleOf(data)}</h2>
          {business.phone && phoneHref && (
            <a
              href={phoneHref}
              className={`mt-8 inline-block font-ns-heading text-[length:clamp(2.25rem,6cqw,3.75rem)] leading-none font-ns-display whitespace-nowrap text-ns-primary tabular-nums underline-offset-8 hover:underline ${focus}`}
            >
              {business.phone}
            </a>
          )}
          <ContactLines model={model} phone={false} className="mt-10" />
        </div>
        <ContactFormBlock
          data={data}
          model={model}
          endpoint={endpoint}
          radius="md"
          className="@5xl:col-span-7"
        />
      </Wrap>
    </section>
  );
}
