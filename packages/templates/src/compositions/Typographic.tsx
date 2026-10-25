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
  ServiceMarquee,
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
  "font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl";

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
            <Wrap wide className="grid gap-10 @5xl:grid-cols-12">
              <div className="@5xl:col-span-4">
                <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
                <AboutPhoto data={section} radius={RADIUS} className="mt-10" />
              </div>
              <div className="@5xl:col-span-8">
                <p className="max-w-[40ch] font-ns-heading text-[length:clamp(1.5rem,2.8cqw,2.25rem)] leading-[1.3] font-ns-display tracking-[-0.01em] text-pretty whitespace-pre-line">
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
            <Wrap wide>
              <h2 className={`ns-rise ${h2}`}>{model.titleOf(section)}</h2>
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
            <Wrap wide className="grid gap-10 @5xl:grid-cols-12">
              <h2 className={`ns-rise ${h2} @5xl:col-span-4`}>{model.titleOf(section)}</h2>
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
        <Wrap wide className="flex h-16 items-center justify-between gap-6 @min-[40rem]:h-20">
          <a
            href="#top"
            className="min-w-0 font-ns-heading text-lg font-ns-display tracking-tight [overflow-wrap:anywhere]"
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
      <main id={anchors ? "main" : undefined} className="flex-1">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <SimpleFooter model={model} bigName wide />
      <MobileCallBar model={model} radius={RADIUS} />
    </div>
  );
}

function TypographicHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business } = model;
  const facts: Fact[] = factsFor(model, { price: false, hours: "line" });
  const kicker = [business.category, model.where].filter(Boolean).join(", ");

  // A frase do topo é a imagem: enorme, fina, sobre o próprio fundo da página (sem bloco de
  // cor chapada). A cor da marca aparece só no botão e num fio curto.
  return (
    <section>
      <Wrap wide className="pt-14 pb-16 @min-[40rem]:pt-20 @5xl:pt-28 @5xl:pb-24">
        {kicker && (
          <p className="text-[0.6875rem] tracking-[0.2em] text-ns-muted uppercase">{kicker}</p>
        )}
        <h1 className="mt-8 font-ns-heading text-[length:calc(clamp(3.25rem,10.5cqw,11.5rem)*var(--ns-display-scale))] leading-[0.86] font-ns-display tracking-[-0.045em] text-balance [overflow-wrap:anywhere]">
          {data.title}
        </h1>
        <div className="mt-14 grid gap-10 border-t border-ns-border pt-8 @5xl:grid-cols-12 @5xl:gap-8">
          <p className="max-w-xl text-lg leading-relaxed text-pretty @min-[40rem]:text-xl @5xl:col-span-5">
            {data.subtitle}
          </p>
          <div className="@5xl:col-span-7 @5xl:justify-self-end">
            <HeroActions model={model} radius={RADIUS} />
          </div>
        </div>
        <FactLine facts={facts} className="mt-12 text-ns-muted" />
        <HighlightList highlights={business.highlights} className="mt-6 text-ns-muted" />
      </Wrap>
      <ServiceMarquee model={model} className="bg-ns-primary text-ns-on-primary" />
      {data.image && (
        <PhotoFrame
          image={data.image}
          sizes="100vw"
          className="relative aspect-[4/3] w-full @min-[40rem]:aspect-[16/9] @5xl:aspect-[21/9]"
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
      <Wrap wide>
        <h2 className="ns-rise max-w-[16ch] font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-6xl">
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
              <h3 className="text-xl font-ns-display text-balance [overflow-wrap:anywhere] @3xl:col-span-3">
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
      <Wrap wide className="grid gap-12 @5xl:grid-cols-12">
        <div className="@5xl:col-span-6">
          <h2 className={`ns-rise ${h2}`}>{model.titleOf(data)}</h2>
          {business.phone && phoneHref && (
            <a
              href={phoneHref}
              className={`mt-10 block font-ns-heading text-[length:clamp(2.25rem,6cqw,4.5rem)] leading-none font-ns-display whitespace-nowrap tabular-nums underline-offset-8 hover:underline ${focus}`}
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
