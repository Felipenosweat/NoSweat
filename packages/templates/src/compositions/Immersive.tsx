import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Photo, PhotoCredit } from "../components/photo";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  AboutPhoto,
  AddressBlock,
  ContactFormBlock,
  ContactLines,
  FactList,
  FaqList,
  HeaderAction,
  HeroActions,
  HighlightList,
  MobileCallBar,
  NavLinks,
  PeopleList,
  PriceList,
  SimpleFooter,
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
        return <ImmersiveServices key={key} id={id} model={model} data={section} />;
      case "about":
        return (
          <section key={key} id={id} className={`scroll-mt-24 bg-ns-surface ${sectionY}`}>
            <Wrap wide className="grid gap-12 @5xl:grid-cols-12 @5xl:items-start">
              <div className="@5xl:col-span-5">
                <p className={microLabel}>{model.words.about}</p>
                <h2 className="mt-3 font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-6xl">
                  {model.titleOf(section)}
                </h2>
                <AboutPhoto data={section} className="mt-10" />
              </div>
              <div className="@5xl:col-span-6 @5xl:col-start-7 @5xl:pt-10">
                <p className="text-xl leading-relaxed text-pretty whitespace-pre-line">
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
              <h2 className="font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-5xl">
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
              <h2 className="text-center font-ns-heading text-4xl font-bold tracking-tight text-balance @min-[40rem]:text-5xl">
                {model.titleOf(section)}
              </h2>
              <FaqList data={section} className="mt-12" />
            </Wrap>
          </section>
        );
      case "contact":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 ${section.showForm ? "@5xl:grid @5xl:grid-cols-2" : ""}`}
          >
            <div className={`bg-ns-text text-ns-background ${sectionY}`}>
              <div
                className={
                  section.showForm
                    ? "mx-auto w-full max-w-xl px-4 @min-[40rem]:px-6 @5xl:mr-0 @5xl:ml-auto @5xl:px-12"
                    : "mx-auto w-full max-w-7xl px-4 @min-[40rem]:px-6 @5xl:px-8"
                }
              >
                <h2 className="font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-5xl">
                  {model.titleOf(section)}
                </h2>
                <SignBoard model={model} />
                <ContactLines model={model} place={false} className="mt-10" />
              </div>
            </div>
            {section.showForm && (
              <div className={`bg-ns-surface ${sectionY}`}>
                <div className="mx-auto w-full max-w-xl px-4 @min-[40rem]:px-6 @5xl:mr-auto @5xl:ml-0 @5xl:px-12">
                  <ContactFormBlock
                    data={section}
                    model={model}
                    endpoint={contactEndpoint}
                    radius="sm"
                  />
                </div>
              </div>
            )}
          </section>
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div id={anchors ? "top" : undefined} className="relative flex min-h-full flex-col">
      <header
        className={
          overlay
            ? "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-ns-text/70 to-transparent text-ns-background"
            : "sticky top-0 z-40 border-b border-ns-border bg-ns-background/95 backdrop-blur"
        }
      >
        <Wrap wide className="flex h-20 items-center justify-between gap-6">
          <a
            href="#top"
            className="min-w-0 font-ns-heading text-xl font-bold tracking-tight [overflow-wrap:anywhere] @min-[40rem]:text-2xl"
          >
            {model.business.name}
          </a>
          <div className="flex shrink-0 items-center gap-8">
            <NavLinks
              model={model}
              className="hidden @5xl:block"
              linkClassName="opacity-85 hover:opacity-100"
            />
            <HeaderAction model={model} radius={RADIUS} />
          </div>
        </Wrap>
      </header>
      <main className="flex-1">{renderSections(spec, render, editable, selectedSection)}</main>
      <SimpleFooter
        model={model}
        wide
        className="border-t border-ns-background/15 bg-ns-text text-ns-background"
      />
      <MobileCallBar model={model} radius="rounded-md" />
    </div>
  );
}

const heroTitle =
  "max-w-[16ch] font-ns-heading text-[length:clamp(2.75rem,7.5cqw,6.5rem)] leading-[0.98] font-bold tracking-tight text-balance [overflow-wrap:anywhere]";

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
    <section className="relative isolate flex min-h-[38rem] items-end overflow-hidden text-ns-background @5xl:min-h-[46rem]">
      <div data-kind={image.kind} className="ns-photo absolute inset-0 -z-10 bg-ns-text">
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
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ns-text/90 via-ns-text/55 to-ns-text/10"
      />
      <Wrap wide className={`pb-14 @5xl:pb-20 ${padTop ? "pt-32" : "pt-16"}`}>
        <h1 className={heroTitle}>{data.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-90 @min-[40rem]:text-xl">
          {data.subtitle}
        </p>
        <HeroActions model={model} surface="dark" radius={RADIUS} className="mt-10" />
        <HighlightList highlights={model.business.highlights} className="mt-8 opacity-90" />
      </Wrap>
      {image.credit && image.source !== "upload" && (
        <div className="absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] rounded-md bg-ns-background/90 px-2 py-1 text-[0.6875rem] leading-tight text-ns-text">
          <PhotoCredit image={image} />
        </div>
      )}
    </section>
  );
}

const STRIP_COLUMNS: Record<number, string> = {
  1: "",
  2: "@3xl:grid-cols-2",
  3: "@3xl:grid-cols-3",
  4: "@3xl:grid-cols-2 @5xl:grid-cols-4",
};

/** Faixa logo abaixo do topo com o que a pessoa precisa saber antes de ir ou ligar. */
function InfoStrip({ model }: { model: SiteModel }) {
  const facts = factsFor(model);
  if (facts.length === 0) return null;
  return (
    <div className="border-b border-ns-border bg-ns-background">
      <Wrap wide>
        <FactList
          facts={facts}
          className={`grid gap-8 py-10 ${STRIP_COLUMNS[facts.length] ?? "@3xl:grid-cols-4"}`}
          labelClassName={microLabel}
          valueClassName="mt-3 text-lg font-medium"
        />
      </Wrap>
    </div>
  );
}

/** Placa de vitrine: horário e endereço grandes, como na porta. */
function SignBoard({ model }: { model: SiteModel }) {
  const hours = model.business.hours?.length ? model.business.hours : null;
  if (!hours && !model.address) return null;
  return (
    <div className="mt-10 grid gap-10 border-y border-ns-background/20 py-10">
      {hours && (
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">Hours</p>
          <dl className="mt-3 space-y-2 font-ns-heading text-2xl leading-tight font-bold @min-[40rem]:text-3xl">
            {hours.map((row, index) => (
              <div key={index} className="flex flex-wrap justify-between gap-x-6">
                <dt>{row.days}</dt>
                <dd className="tabular-nums">{row.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {model.address && (
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">Find us</p>
          <AddressBlock model={model} large className="mt-3" />
        </div>
      )}
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
        <h2 className="mt-3 max-w-[18ch] font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-6xl">
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
                <h3 className="font-ns-heading text-2xl font-bold text-balance [overflow-wrap:anywhere] @min-[40rem]:text-3xl">
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
