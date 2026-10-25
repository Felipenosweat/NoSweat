import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Photo, PhotoCredit } from "../components/photo";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  AboutPhoto,
  FactLine,
  FaqList,
  HeroActions,
  HighlightList,
  MobileCallBar,
  PeopleList,
  PriceList,
  ServiceMarquee,
  ContactSection,
  SimpleFooter,
  SiteHeader,
  Wrap,
  factsFor,
  hasPriceList,
  sectionY,
} from "./shared";

/** Botões em pílula; fotos e blocos retos (a foto de ponta a ponta manda). */
const RADIUS = "rounded-full";

const microLabel = "text-xs font-semibold tracking-[0.18em] text-ns-primary uppercase";

/**
 * Composição IMERSIVA (foto em primeiro lugar): a foto ocupa o topo de ponta a ponta, com o
 * texto embaixo à esquerda sobre um véu escuro (contraste garantido com qualquer foto), uma
 * faixa de informações práticas (horário, onde fica com a rota, telefone), o cardápio em grupos
 * e o contato como placa de vitrine (horário e endereço grandes). Sem foto, o topo vira um
 * palco escuro só com o texto.
 */
export function ImmersiveComposition({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);
  const first = spec.sections[0];
  // O cabeçalho só fica transparente por cima da foto quando o site começa por ela.
  const overlay = first?.type === "hero";

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    switch (section.type) {
      case "hero":
        return (
          <div key={key}>
            <ImmersiveHero model={model} data={section} padTop={overlay && index === 0} />
            <InfoStrip model={model} />
          </div>
        );
      case "services":
        return (
          <div key={key}>
            <ServiceMarquee model={model} className="border-b border-ns-border" />
            <ImmersiveServices id={id} model={model} data={section} />
          </div>
        );
      case "about":
        return (
          <section key={key} id={id} className={`scroll-mt-24 bg-ns-surface ${sectionY}`}>
            <Wrap wide className="grid gap-12 @5xl:grid-cols-12 @5xl:items-start">
              <div className="@5xl:col-span-5">
                <p className={microLabel}>{model.words.about}</p>
                <h2 className="ns-rise mt-3 font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-6xl">
                  {model.titleOf(section)}
                </h2>
                <AboutPhoto data={section} className="mt-10" />
              </div>
              <div className="@5xl:col-span-6 @5xl:col-start-7 @5xl:pt-10">
                <p className="ns-rise font-ns-heading text-[length:clamp(1.625rem,2.9cqw,2.75rem)] leading-[1.25] font-ns-display tracking-[-0.015em] text-pretty whitespace-pre-line">
                  {section.body}
                </p>
                {section.people && <PeopleList people={section.people} className="mt-12" />}
              </div>
            </Wrap>
          </section>
        );
      case "testimonials":
        if (section.items.length === 0) return null;
        return (
          <section key={key} id={id} className={`scroll-mt-24 ${sectionY}`}>
            <Wrap wide>
              <h2 className="ns-rise font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl">
                {model.titleOf(section)}
              </h2>
              <ul className="mt-12 grid gap-10 @3xl:grid-cols-2">
                {section.items.map((item, i) => (
                  <li key={`${item.author}-${i}`}>
                    <figure>
                      <blockquote className="font-ns-heading text-2xl leading-snug text-pretty @min-[40rem]:text-3xl">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-4 font-semibold text-ns-muted">
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
            variant="wall"
            radius="rounded-none"
            wide
          />
        );
      case "faq":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="max-w-3xl">
              <h2 className="ns-rise text-center font-ns-heading text-4xl font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl">
                {model.titleOf(section)}
              </h2>
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
    <div id={anchors ? "top" : undefined} className="relative flex min-h-full flex-col">
      <SiteHeader model={model} radius={RADIUS} wide overlay={overlay} />
      <main id={anchors ? "main" : undefined} className="flex-1">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <SimpleFooter
        model={model}
        wide
        bigName
        className="border-t border-ns-background/15 bg-ns-text text-ns-background"
      />
      <MobileCallBar model={model} radius="rounded-md" />
    </div>
  );
}

const heroTitle =
  "max-w-[14ch] font-ns-heading text-[length:calc(clamp(3rem,9cqw,9rem)*var(--ns-display-scale))] leading-[0.9] font-ns-display tracking-[-0.035em] text-balance [overflow-wrap:anywhere]";

function ImmersiveHero({
  model,
  data,
  padTop,
}: {
  model: SiteModel;
  data: SectionOf<"hero">;
  padTop: boolean;
}) {
  if (!data.image) {
    // Sem foto: palco escuro, texto centralizado e uma linha na cor da marca. Diferente de
    // propósito do bloco colorido da composição tipográfica.
    return (
      <section className="bg-ns-text text-ns-background">
        <Wrap wide className={`text-center ${padTop ? "pt-36 pb-24" : "py-24"} @5xl:py-36`}>
          <span aria-hidden="true" className="mx-auto mb-10 block h-1 w-16 bg-ns-primary" />
          <h1 className={`${heroTitle} mx-auto`}>{data.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-85 @min-[40rem]:text-xl">
            {data.subtitle}
          </p>
          <HeroActions
            model={model}
            surface="dark"
            radius={RADIUS}
            className="mt-10 @min-[40rem]:justify-center"
          />
        </Wrap>
      </section>
    );
  }
  const image = data.image;
  return (
    <section className="relative isolate flex min-h-[max(40rem,100svh)] items-end overflow-hidden text-ns-background">
      <div
        data-kind={image.kind}
        className="ns-photo ns-hero-zoom absolute inset-0 -z-10 overflow-hidden bg-ns-text"
      >
        <Photo
          image={image}
          loading="eager"
          sizes="100vw"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      {/* Véu escuro: o texto fica legível sobre qualquer foto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ns-text/90 via-ns-text/35 to-ns-text/25"
      />
      <Wrap wide className={`pb-12 @5xl:pb-16 ${padTop ? "pt-36" : "pt-20"}`}>
        {model.business.category && (
          <p className="text-[0.6875rem] tracking-[0.22em] uppercase opacity-85">
            {[model.business.category, model.where].filter(Boolean).join(", ")}
          </p>
        )}
        <h1 className="mt-6 font-ns-heading text-[length:calc(clamp(3.25rem,10.5cqw,11rem)*var(--ns-display-scale))] leading-[0.88] font-ns-display tracking-[-0.04em] text-balance [overflow-wrap:anywhere]">
          {data.title}
        </h1>
        <div className="mt-10 grid gap-8 border-t border-ns-background/30 pt-8 @5xl:grid-cols-12 @5xl:items-end">
          <p className="max-w-xl text-lg leading-relaxed opacity-90 @min-[40rem]:text-xl @5xl:col-span-6">
            {data.subtitle}
          </p>
          <div className="@5xl:col-span-6 @5xl:justify-self-end">
            <HeroActions model={model} surface="dark" radius={RADIUS} />
          </div>
        </div>
        <HighlightList highlights={model.business.highlights} className="mt-8 opacity-85" />
      </Wrap>
      {image.credit && (
        <div className="absolute top-24 right-3 max-w-[calc(100%-1.5rem)] text-[0.6875rem] leading-tight opacity-80 @5xl:right-8 [&_a]:underline">
          <PhotoCredit image={image} />
        </div>
      )}
    </section>
  );
}

/** Linha fina logo abaixo do topo com o que a pessoa precisa saber antes de ir ou ligar. */
function InfoStrip({ model }: { model: SiteModel }) {
  const facts = factsFor(model, { hours: "line" });
  if (facts.length === 0) return null;
  return (
    <div className="border-b border-ns-border bg-ns-background">
      <Wrap wide>
        <FactLine facts={facts} className="py-7 text-ns-muted [&_dd]:text-ns-text" />
      </Wrap>
    </div>
  );
}

function ImmersiveServices({
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
      <Wrap wide>
        <p className={microLabel}>{model.words.services}</p>
        <h2 className="ns-rise mt-3 max-w-[18ch] font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-6xl">
          {model.titleOf(data)}
        </h2>
        {hasPriceList(data) ? (
          <PriceList data={data} className="mt-14" />
        ) : (
          <ul className="mt-14 grid gap-x-16 gap-y-12 @3xl:grid-cols-2">
            {data.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className={`border-t-2 border-ns-text pt-6 ${index % 2 === 1 ? "@3xl:mt-16" : ""}`}
              >
                <h3 className="font-ns-heading text-3xl font-ns-display tracking-[-0.02em] text-balance [overflow-wrap:anywhere] @min-[40rem]:text-5xl">
                  {item.name}
                </h3>
                <p className="mt-3 max-w-[48ch] leading-relaxed text-ns-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </section>
  );
}
