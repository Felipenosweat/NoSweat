import type { Section, SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Gallery } from "../sections/Gallery";
import type { TemplateProps } from "../types";
import { MobileCallBar } from "../templates/home-services/parts";
import { buildModel, renderSections, type SiteModel } from "./model";
import {
  ContactFormBlock,
  FaqList,
  HeaderCall,
  HeroActions,
  HoursTable,
  NavLinks,
  PhotoFrame,
  SimpleFooter,
  Wrap,
  sectionY,
} from "./shared";

/**
 * Composição TIPOGRÁFICA: a frase do topo é a imagem principal, enorme, num bloco da cor da
 * marca, com um quadro "de relance" só com fatos reais (área, horário, telefone, selos).
 * A foto (se houver) vira uma faixa larga depois do topo. Serviços como índice numerado,
 * contato com o telefone em destaque sobre fundo escuro.
 */
export function TypographicComposition({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
}: TemplateProps) {
  const model = buildModel(spec);

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    switch (section.type) {
      case "hero":
        return <TypographicHero key={key} model={model} data={section} />;
      case "services":
        return <IndexServices key={key} id={id} model={model} data={section} />;
      case "testimonials":
        return (
          <section key={key} id={id} className={`scroll-mt-24 ${sectionY}`}>
            <Wrap className="grid gap-12 @3xl:grid-cols-2">
              {section.items.map((item, i) => (
                <figure key={`${item.author}-${i}`} className="border-l-4 border-ns-primary pl-6">
                  <blockquote className="text-xl leading-relaxed text-pretty">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 font-semibold">{item.author}</figcaption>
                </figure>
              ))}
            </Wrap>
          </section>
        );
      case "gallery":
        return <Gallery key={key} id={id} data={section} />;
      case "faq":
        return (
          <section
            key={key}
            id={id}
            className={`scroll-mt-24 border-t border-ns-border ${sectionY}`}
          >
            <Wrap className="grid gap-10 @5xl:grid-cols-12">
              <h2 className="font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @5xl:col-span-4 @min-[40rem]:text-5xl">
                {model.words.faqTitle}
              </h2>
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
    <div id="top" className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-background/95 backdrop-blur">
        <Wrap className="flex h-16 items-center justify-between gap-6">
          <a
            href="#top"
            className="min-w-0 font-ns-heading text-lg font-bold tracking-tight [overflow-wrap:anywhere]"
          >
            {model.business.name}
          </a>
          <div className="flex items-center gap-7">
            <NavLinks
              model={model}
              className="hidden @3xl:block"
              linkClassName="text-ns-muted hover:text-ns-text"
            />
            <HeaderCall model={model} className="text-ns-primary" />
          </div>
        </Wrap>
      </header>
      <main className="flex-1">{renderSections(spec, render, editable, selectedSection)}</main>
      <SimpleFooter model={model} bigName />
      <MobileCallBar
        phone={model.business.phone}
        ctaLabel={model.ctaLabel}
        ctaHref={model.ctaHref}
        emphasis={model.primaryAction === "call" ? "call" : "cta"}
      />
    </div>
  );
}

function TypographicHero({ model, data }: { model: SiteModel; data: SectionOf<"hero"> }) {
  const { business, where, phoneHref } = model;
  const hours = business.hours?.length ? business.hours : null;
  const glance: { label: string; content: ReactNode }[] = [];
  if (where) glance.push({ label: business.serviceArea ? "Serving" : "Based in", content: where });
  if (hours)
    glance.push({ label: "Hours", content: <HoursTable hours={hours} className="text-sm" /> });
  if (business.phone && phoneHref) {
    glance.push({
      label: "Phone",
      content: (
        <a href={phoneHref} className="whitespace-nowrap underline-offset-4 hover:underline">
          {business.phone}
        </a>
      ),
    });
  }
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
            <h1 className="font-ns-heading text-[length:clamp(3rem,9.5cqw,8.25rem)] leading-[0.92] font-bold tracking-tight text-balance [overflow-wrap:anywhere]">
              {data.title}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed opacity-90 @min-[40rem]:text-xl">
              {data.subtitle}
            </p>
            <HeroActions model={model} surface="primary" radius="rounded-md" className="mt-10" />
          </div>
          {glance.length > 0 && (
            <dl className="grid content-start gap-6 border-t border-ns-on-primary/30 pt-8 @min-[40rem]:grid-cols-2 @5xl:col-span-3 @5xl:grid-cols-1 @5xl:border-t-0 @5xl:border-l @5xl:pt-2 @5xl:pl-8">
              {glance.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
                    {item.label}
                  </dt>
                  <dd className="mt-2 font-medium">{item.content}</dd>
                </div>
              ))}
            </dl>
          )}
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

function IndexServices({
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
        <h2 className="max-w-[16ch] font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-6xl">
          {model.words.servicesTitle}
        </h2>
        <ol className="mt-14 grid gap-x-12 @3xl:grid-cols-2">
          {data.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex gap-6 border-t border-ns-border py-8">
              <span className="w-12 shrink-0 font-ns-heading text-4xl leading-none font-bold text-ns-primary tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-balance [overflow-wrap:anywhere]">
                  {item.name}
                </h3>
                <p className="mt-2 leading-relaxed text-ns-muted">{item.description}</p>
              </div>
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
  const { business, phoneHref, where } = model;
  return (
    <section id={id} className={`scroll-mt-24 bg-ns-text text-ns-background ${sectionY}`}>
      <Wrap className="grid gap-12 @5xl:grid-cols-12">
        <div className="@5xl:col-span-6">
          <h2 className="font-ns-heading text-4xl leading-tight font-bold tracking-tight text-balance @min-[40rem]:text-5xl">
            {model.words.contactTitle}
          </h2>
          {business.phone && phoneHref && (
            <a
              href={phoneHref}
              className="mt-10 block font-ns-heading text-[length:clamp(2.25rem,6cqw,4.5rem)] leading-none font-bold whitespace-nowrap underline-offset-8 hover:underline"
            >
              {business.phone}
            </a>
          )}
          <div className="mt-8 space-y-2 text-lg opacity-85">
            {business.email && (
              <p>
                <a
                  href={`mailto:${business.email}`}
                  className="[overflow-wrap:anywhere] underline-offset-4 hover:underline"
                >
                  {business.email}
                </a>
              </p>
            )}
            {where && <p>{where}</p>}
          </div>
        </div>
        {data.showForm && (
          <div className="rounded-lg bg-ns-background p-6 text-ns-text @min-[40rem]:p-8 @5xl:col-span-6">
            <ContactFormBlock data={data} endpoint={endpoint} />
          </div>
        )}
      </Wrap>
    </section>
  );
}
