import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  AboutPhoto,
  ContactFormBlock,
  ContactLines,
  FactList,
  FaqList,
  HeaderAction,
  HeroActions,
  MobileCallBar,
  NavLinks,
  PeopleList,
  PhotoFrame,
  SimpleFooter,
  Wrap,
  factsFor,
  focus,
  sectionY,
  type Fact,
} from "./shared";

/** Um raio só, discreto, para botões e o quadro do formulário. */
const RADIUS = "rounded-md";

const h2 =
  "font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-5xl";

/**
 * Composição TIPOGRÁFICA: a frase do topo é a imagem principal, enorme, num bloco da cor da
 * marca, com um painel de fatos reais (horário, área, telefone, selos). A foto (se houver) vira
 * uma faixa larga depois do topo. Serviços como livro-caixa (número | nome | descrição |
 * frequência/preço), contato com o telefone em destaque sobre fundo escuro. A cor secundária
 * aparece só como fio fino.
 */
export function TypographicComposition({
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
        return <TypographicHero key={key} model={model} data={section} />;
      case "services":
        return <LedgerServices key={key} id={id} model={model} data={section} />;
      case "about":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <div className="@5xl:col-span-4">
                <h2 className={h2}>{model.titleOf(section)}</h2>
                <AboutPhoto data={section} radius={RADIUS} className="mt-10" />
              </div>
              <div className="@5xl:col-span-8">
                <p className="max-w-[62ch] text-xl leading-relaxed text-pretty whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && (
                  <PeopleList
                    people={section.people}
                    radius={RADIUS}
                    className="mt-12 border-t-2 border-ns-text pt-10"
                  />
                )}
              </div>
            </Wrap>
          </section>
        );
      case "testimonials":
        if (section.items.length === 0) return null;
        return (
          <section key={key} id={id} className={`scroll-mt-24 bg-ns-surface ${sectionY}`}>
            <Wrap>
              <h2 className={h2}>{model.titleOf(section)}</h2>
              <ul className="mt-12 grid gap-12 @3xl:grid-cols-2">
                {section.items.map((item, i) => (
                  <li key={`${item.author}-${i}`}>
                    <figure className="border-l-4 border-ns-primary pl-6">
                      <blockquote className="text-xl leading-relaxed text-pretty">
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
      case "faq":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <h2 className={`${h2} @5xl:col-span-4`}>{model.titleOf(section)}</h2>
              <FaqList data={section} className="@5xl:col-span-8" />
            </Wrap>
          </section>
        );
      case "contact":
        return (
          <TypographicContact
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
      <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-background/95 backdrop-blur">
        <Wrap className="flex h-16 items-center justify-between gap-6">
          <a
            href="#top"
            className="min-w-0 font-ns-heading text-lg font-bold tracking-tight [overflow-wrap:anywhere]"
          >
            {model.business.name}
          </a>
          <div className="flex shrink-0 items-center gap-7">
            <NavLinks
              model={model}
              className="hidden @5xl:block"
              linkClassName="text-ns-muted hover:text-ns-text"
            />
            <HeaderAction model={model} radius={RADIUS} />
          </div>
        </Wrap>
      </header>
      <main className="flex-1">{renderSections(spec, render, editable, selectedSection)}</main>
      <SimpleFooter model={model} bigName />
      <MobileCallBar model={model} radius={RADIUS} />
    </div>
  );
}

function TypographicHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business } = model;
  const glance: Fact[] = factsFor(model, { price: false });
  if (business.highlights?.length) {
    glance.push({
      label: "Good to know",
      content: (
        <ul className="space-y-1">
          {business.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <section>
      <div className="bg-ns-primary text-ns-on-primary">
        <Wrap className="grid gap-12 py-16 @min-[40rem]:py-24 @5xl:grid-cols-12 @5xl:py-28">
          <div className={glance.length ? "@5xl:col-span-9" : "@5xl:col-span-12"}>
            <span aria-hidden="true" className="mb-10 block h-0.5 w-16 bg-ns-secondary" />
            {business.category && (
              <p className="mb-5 text-xs font-semibold tracking-[0.18em] uppercase">
                {business.category}
              </p>
            )}
            <h1 className="font-ns-heading text-[length:clamp(3rem,9.5cqw,8.25rem)] leading-[0.92] font-bold tracking-tight text-balance [overflow-wrap:anywhere]">
              {data.title}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed @min-[40rem]:text-xl">
              {data.subtitle}
            </p>
            <HeroActions model={model} surface="primary" radius={RADIUS} className="mt-10" />
          </div>
          <FactList
            facts={glance}
            className="grid content-start gap-6 border-t border-ns-on-primary/30 pt-8 @min-[40rem]:grid-cols-2 @5xl:col-span-3 @5xl:grid-cols-1 @5xl:border-t-0 @5xl:border-l @5xl:pt-2 @5xl:pl-8"
          />
        </Wrap>
      </div>
      {data.image && (
        <PhotoFrame
          image={data.image}
          eager
          sizes="100vw"
          className="relative aspect-[16/9] w-full @5xl:aspect-[3/1]"
        />
      )}
    </section>
  );
}

/** Serviços como livro-caixa: número | nome | descrição | frequência e preço do dono. */
function LedgerServices({
  id,
  model,
  data,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"services">;
}) {
  if (data.items.length === 0) return null;
  const withMeta = data.items.some((item) => item.price || item.detail);
  return (
    <section id={id} className={`scroll-mt-24 ${sectionY}`}>
      <Wrap>
        <h2 className="max-w-[16ch] font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-6xl">
          {model.titleOf(data)}
        </h2>
        <ol className="mt-14 border-t-2 border-ns-text">
          {data.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="grid gap-2 border-b border-ns-border py-7 @3xl:grid-cols-12 @3xl:gap-6"
            >
              <span className="font-ns-heading text-sm font-semibold text-ns-primary tabular-nums @3xl:col-span-1 @3xl:pt-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-bold text-balance [overflow-wrap:anywhere] @3xl:col-span-3">
                {item.name}
              </h3>
              <p
                className={`max-w-[60ch] leading-relaxed text-ns-muted ${withMeta ? "@3xl:col-span-5" : "@3xl:col-span-8"}`}
              >
                {item.description}
              </p>
              {withMeta && (
                <p className="flex gap-3 tabular-nums @3xl:col-span-3 @3xl:flex-col @3xl:gap-0.5 @3xl:text-right">
                  {item.price && <span className="font-semibold">{item.price}</span>}
                  {item.detail && <span className="text-sm text-ns-muted">{item.detail}</span>}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Wrap>
    </section>
  );
}

function TypographicContact({
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
    <section id={id} className={`scroll-mt-24 bg-ns-text text-ns-background ${sectionY}`}>
      <Wrap className="grid gap-12 @5xl:grid-cols-12">
        <div className="@5xl:col-span-6">
          <h2 className={h2}>{model.titleOf(data)}</h2>
          {business.phone && phoneHref && (
            <a
              href={phoneHref}
              className={`mt-10 block font-ns-heading text-[length:clamp(2.25rem,6cqw,4.5rem)] leading-none font-bold whitespace-nowrap tabular-nums underline-offset-8 hover:underline ${focus}`}
            >
              {business.phone}
            </a>
          )}
          <ContactLines model={model} phone={false} className="mt-10" />
        </div>
        {data.showForm && (
          <div
            className={`${RADIUS} bg-ns-background p-6 text-ns-text @min-[40rem]:p-8 @5xl:col-span-6`}
          >
            <ContactFormBlock
              data={data}
              model={model}
              endpoint={endpoint}
              radius="md"
              framed={false}
            />
          </div>
        )}
      </Wrap>
    </section>
  );
}
