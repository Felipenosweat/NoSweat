import type { Composition, Section, SectionOf, SiteImage } from "@nosweat/schema";
import type { CSSProperties, ReactNode } from "react";
import { PhoneIcon } from "../components/icons";
import { Photo, PhotoCredit } from "../components/photo";
import type { TemplateProps } from "../types";
import { Motion } from "./Motion";
import { NavMenu } from "./NavMenu";
import { ReviewUsLink } from "./ReviewLink";
import {
  buildModel,
  externalProps,
  isOwnerPhoto,
  location,
  renderSections,
  type SiteModel,
} from "./model";
import {
  ContactFormBlock,
  ContactLines,
  FaqList,
  HighlightList,
  HoursTable,
  MobileCallBar,
  focus,
  hoursSummary,
  ServiceAreaList,
  serviceNames,
  socialLinks,
} from "./shared";
import { VISITOR_PRIVACY_URL } from "../sections/ContactForm";

// Molde SIGNATURE: o padrão de site premiado aprovado pelo dono (protótipo do Still Water Spa).
// Uma arquitetura só, com o topo num de 5 formatos (um por composição do plano de design) e as
// peças premium em todas: abertura, menu de vidro, frase que acende, fotos com movimento, lista
// de serviços com foto que segue o mouse, galeria que corre de lado e rodapé gigante.
// O movimento (Motion.tsx) só liga no site de verdade: no editor e nas miniaturas fica parado.

const wrap = "w-full px-5 @min-[40rem]:px-8 @5xl:px-16";
const label = "text-[0.6875rem] tracking-[0.22em] uppercase";
const display = "font-ns-heading font-ns-display tracking-[-0.035em]";

/** Título com a última palavra em itálico ("Before your *visit*"). */
function Accent({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em className="italic">{last}</em>
    </>
  );
}

/** Nome do negócio em duas linhas para o topo gigante ("Still" / "Water Spa"). */
function nameLines(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name, ""];
  const cut = words.length === 2 ? 1 : Math.ceil(words.length / 2) - (words.length > 3 ? 0 : 1);
  return [words.slice(0, Math.max(1, cut)).join(" "), words.slice(Math.max(1, cut)).join(" ")];
}

/** Nome comprido diminui no topo gigante (sem cobrir o texto embaixo). */
function nameScale(name: string): number {
  const length = name.trim().length;
  if (length <= 14) return 1;
  if (length <= 20) return 0.82;
  return 0.66;
}

/** Fotos para a decoração (paralaxe, lista de serviços, fundo do agendamento). */
function photoPool(model: SiteModel): SiteImage[] {
  const pool: SiteImage[] = [];
  if (model.hero?.image) pool.push(model.hero.image);
  for (const section of model.spec.sections) {
    if (section.type === "gallery") pool.push(...section.images.filter((i) => isOwnerPhoto(i)));
    if (section.type === "about" && isOwnerPhoto(section.image)) pool.push(section.image);
  }
  return pool;
}

export function SignatureComposition({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);
  const motion = anchors && !editable;
  const pool = photoPool(model);
  const composition: Composition = spec.design?.composition ?? "service-led";

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    switch (section.type) {
      case "hero":
        return (
          <SignatureHero
            key={key}
            model={model}
            data={section}
            variant={composition}
            intro={motion && index === 0}
          />
        );
      case "about":
        return <Statement key={key} id={id} model={model} data={section} pool={pool} />;
      case "services":
        return (
          <ServiceIndex
            key={key}
            id={id}
            model={model}
            data={section}
            pool={pool}
            variant={composition}
          />
        );
      case "gallery":
        return <Rail key={key} id={id} model={model} data={section} motion={motion} />;
      case "testimonials":
        return <Quotes key={key} id={id} model={model} data={section} />;
      case "faq":
        return (
          <section key={key} id={id} className={`scroll-mt-28 py-(--ns-section-y) ${wrap}`}>
            <div className="grid gap-12 @5xl:grid-cols-12">
              <h2
                data-ns-rise
                className={`${display} text-[length:clamp(2.75rem,5cqw,5.25rem)] leading-[0.95] @5xl:col-span-4`}
              >
                <Accent text={model.titleOf(section)} />
              </h2>
              <div data-ns-fade className="@5xl:col-span-7 @5xl:col-start-6">
                <FaqList data={section} />
              </div>
            </div>
          </section>
        );
      case "contact":
        return (
          <div key={key}>
            <div data-ns-fade>
              <ServiceAreaList
                model={model}
                className={`border-t border-ns-border py-(--ns-section-y) ${wrap}`}
              />
            </div>
            <Booking id={id} model={model} data={section} pool={pool} endpoint={contactEndpoint} />
          </div>
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div
      id={anchors ? "top" : undefined}
      className="relative flex min-h-full flex-col overflow-x-clip"
    >
      {motion && model.hero && <Intro name={model.business.name} place={model.where} />}
      <GlassNav model={model} />
      <main id={anchors ? "main" : undefined} className="flex-1">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <GiantFooter model={model} pool={pool} />
      <MobileCallBar model={model} radius="rounded-full" />
      {motion && <Motion />}
    </div>
  );
}

/** Atraso de cada letra da abertura: 20 ms por letra, no máximo 100 ms (nome comprido não atrasa). */
const introDelay = (index: number) => `${Math.min(index * 0.02, 0.1).toFixed(2)}s`;

/**
 * Abertura: o nome sobe letra por letra e a cortina sobe. Só CSS (styles.css, .ns-intro), tudo
 * em até 0,6 s para não atrasar o topo (LCP); com "reduzir movimento", não aparece.
 */
function Intro({ name, place }: { name: string; place?: string }) {
  return (
    <div aria-hidden="true" className="ns-intro bg-ns-text text-ns-background">
      <p className={`ns-intro-word ${display} text-[length:clamp(3rem,10cqw,10rem)] leading-none`}>
        {Array.from(name).map((char, i) => (
          <span key={i} style={{ "--ns-intro-delay": introDelay(i) } as CSSProperties}>
            {char === " " ? " " : char}
          </span>
        ))}
      </p>
      {place && (
        <p
          className={`absolute bottom-8 left-5 opacity-70 @min-[40rem]:left-8 @5xl:left-16 ${label}`}
        >
          {place}
        </p>
      )}
    </div>
  );
}

/**
 * Menu de vidro (liquid glass) no alto. Três larguras (do site, não da janela: @container):
 * - celular (< 48rem): uma barra flutuante de ponta a ponta: nome à esquerda; ligar e o botão
 *   de menu (44 px cada) à direita; respeita o recorte da tela (safe-area);
 * - tablet (48rem a 80rem): a cápsula de sempre (aprovada pelo dono no iPad): do tamanho do
 *   conteúdo e no meio (classic/centered) ou duas cápsulas nas pontas (bar/minimal);
 * - computador (>= 80rem): barra da largura do conteúdo, com o nome alinhado ao texto da página.
 *   classic: nome | links, telefone, botão. centered: links | nome no meio | telefone, botão.
 *   bar: faixa de vidro presa no alto, sem flutuar. minimal: sem links; telefone, botão e menu.
 * O vidro das cápsulas do tablet (bar/minimal) é ligado no CSS (.ns-navpart, styles.css).
 */
function GlassNav({ model }: { model: SiteModel }) {
  const { business, links, ctaHref, ctaLabel, ctaExternal, phoneHref } = model;
  const header = model.style.header;
  const split = header === "bar" || header === "minimal";
  const centered = header === "centered";
  // "minimal" nunca mostra os links em linha: tudo fica no botão de menu.
  const inline = header !== "minimal" && links.length > 0;
  const hasPhone = Boolean(phoneHref && business.phone);

  const cta = (
    <a
      href={ctaHref}
      {...externalProps(ctaHref)}
      className={`ns-btn ns-btn-primary hidden min-h-11 items-center rounded-full bg-ns-text px-5 text-sm font-medium whitespace-nowrap text-ns-background transition hover:opacity-90 motion-reduce:transition-none @3xl:inline-flex @7xl:min-h-12 @7xl:px-6 @7xl:text-[0.9375rem] ${focus}`}
    >
      {ctaLabel}
    </a>
  );
  const phone = hasPhone ? (
    <a
      href={phoneHref}
      aria-label={`Call ${business.phone}`}
      className={`inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ns-text/[0.07] text-sm tabular-nums @3xl:size-auto @3xl:min-h-11 @3xl:min-w-11 @3xl:bg-transparent @7xl:text-[0.9375rem] ${focus}`}
    >
      <PhoneIcon className="size-4 shrink-0" />
      <span className="hidden @5xl:inline">{business.phone}</span>
    </a>
  ) : null;
  const menuButton =
    links.length > 0 ? (
      <NavMenu
        links={links}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
        ctaExternal={ctaExternal}
        phoneHref={phoneHref}
        phone={business.phone}
        className={inline ? "@5xl:hidden" : ""}
      />
    ) : null;
  const menu = inline ? (
    <nav
      aria-label="Main"
      className={`hidden @5xl:block ${centered ? "@7xl:col-start-1 @7xl:row-start-1" : ""}`}
    >
      <ul className="flex items-center gap-7 text-sm @7xl:gap-9 @7xl:text-[0.9375rem]">
        {links.map((link) => (
          <li key={link.anchor}>
            <a
              href={`#${link.anchor}`}
              className={`ns-underline inline-flex min-h-11 items-center whitespace-nowrap ${focus}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ) : null;

  // Classes por formato. Tablet = @3xl até antes de @7xl (o visual aprovado no iPad).
  const shell = split ? "@3xl:px-6 @3xl:pt-4" : "justify-center @3xl:px-4 @3xl:pt-4";
  const bar = split
    ? // No tablet a barra de fora fica transparente e as duas cápsulas ganham o vidro.
      "@3xl:h-auto @3xl:justify-between @3xl:gap-4 @3xl:p-0"
    : "@3xl:w-auto @3xl:max-w-full @3xl:gap-5 @3xl:pl-6 @5xl:gap-8";
  const desktop =
    header === "bar"
      ? "ns-navbar-dock @7xl:h-[4.5rem] @7xl:rounded-none @7xl:px-16"
      : centered
        ? "@7xl:grid @7xl:h-16 @7xl:grid-cols-[1fr_auto_1fr] @7xl:pr-2 @7xl:pl-6"
        : "@7xl:h-16 @7xl:pr-2 @7xl:pl-6";
  const brandPart = split
    ? "@3xl:h-14 @3xl:flex-initial @3xl:rounded-full @3xl:px-6 @7xl:h-auto @7xl:flex-1 @7xl:rounded-none @7xl:px-0"
    : centered
      ? "@3xl:flex-initial @7xl:col-start-2 @7xl:row-start-1 @7xl:justify-center"
      : "@3xl:flex-initial @7xl:flex-1";
  const actionsPart = split
    ? "@3xl:h-14 @3xl:gap-5 @3xl:rounded-full @3xl:pr-1.5 @3xl:pl-5 @7xl:h-auto @7xl:gap-6 @7xl:rounded-none @7xl:p-0"
    : `@3xl:gap-5 @5xl:gap-8 @7xl:gap-6 ${centered ? "@7xl:col-start-3 @7xl:row-start-1 @7xl:justify-self-end" : ""}`;

  return (
    <header
      data-split={split ? "" : undefined}
      className={`ns-nav pointer-events-none fixed inset-x-0 top-0 z-40 flex px-3 pt-[max(0.625rem,env(safe-area-inset-top))] ${shell} ${header === "bar" ? "@7xl:px-0 @7xl:pt-0" : "@7xl:px-10 @7xl:pt-5"}`}
    >
      <div
        className={`ns-glass ns-navbar pointer-events-auto relative flex h-14 w-full min-w-0 items-center gap-1.5 rounded-full pr-1.5 pl-5 text-ns-text ${bar} @7xl:w-full @7xl:gap-8 ${desktop}`}
      >
        <div className={`ns-navpart flex min-w-0 flex-1 items-center ${brandPart}`}>
          <a
            href="#top"
            className={`block min-w-0 truncate py-3.5 ${display} text-lg leading-none @min-[40rem]:text-xl @7xl:text-2xl ${focus}`}
          >
            {business.name}
          </a>
        </div>
        {!split && menu}
        <div className={`ns-navpart flex shrink-0 items-center gap-1.5 ${actionsPart}`}>
          {split && menu}
          {phone}
          {cta}
          {menuButton}
        </div>
      </div>
    </header>
  );
}

/** Botões do topo (o primeiro é a ação principal do plano). */
function Actions({
  model,
  tone,
  stack = false,
}: {
  model: SiteModel;
  tone: "light" | "dark";
  /** Coluna estreita do topo (3 de 12): no computador os botões ficam um embaixo do outro. */
  stack?: boolean;
}) {
  const { ctaHref, ctaLabel, phoneHref, business, primaryAction } = model;
  const solid =
    tone === "light"
      ? "ns-btn-primary bg-ns-background text-ns-text"
      : "ns-btn-primary bg-ns-text text-ns-background";
  const ghost =
    tone === "light"
      ? "ns-btn-secondary border border-ns-background/45"
      : "ns-btn-secondary border border-ns-text/25";
  const base = `ns-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[0.9375rem] font-medium whitespace-nowrap transition hover:opacity-90 motion-reduce:transition-none ${focus}`;
  const hasCall = Boolean(phoneHref && business.phone);
  const callFirst = primaryAction === "call" && hasCall;
  const call = (primary: boolean) =>
    hasCall ? (
      <a key="call" href={phoneHref} className={`${base} tabular-nums ${primary ? solid : ghost}`}>
        {primary ? `Call ${business.phone}` : business.phone}
      </a>
    ) : null;
  const cta = (primary: boolean) => (
    <a
      key="cta"
      href={ctaHref}
      {...externalProps(ctaHref)}
      className={`${base} ${primary ? solid : ghost}`}
    >
      {ctaLabel}
    </a>
  );
  return (
    <div className={`flex flex-col gap-3 @min-[40rem]:flex-row ${stack ? "@5xl:flex-col" : ""}`}>
      {callFirst ? [call(true), cta(false)] : [cta(true), call(false)]}
    </div>
  );
}

/** Fatos do topo em colunas (como a ficha de um site premiado). */
function HeroFacts({ model, className = "" }: { model: SiteModel; className?: string }) {
  const { business } = model;
  const hours = hoursSummary(business.hours);
  const city = location(business);
  const cells: { label: string; value: ReactNode }[] = [];
  if (business.category) cells.push({ label: business.category, value: model.hero?.title });
  if (hours) cells.push({ label: "Hours", value: hours });
  if (business.address)
    cells.push({
      label: "Find us",
      value: (
        <>
          {business.address}
          {city ? (
            <>
              <br />
              {city}
            </>
          ) : null}
        </>
      ),
    });
  else if (model.where) cells.push({ label: model.areaLabel, value: model.where });
  if (business.phone && model.phoneHref)
    cells.push({
      label: "Call",
      value: (
        <a href={model.phoneHref} className={`tabular-nums ${focus}`}>
          {business.phone}
        </a>
      ),
    });
  if (cells.length === 0) return null;
  return (
    <dl
      className={`grid grid-cols-2 gap-x-6 gap-y-5 text-sm leading-relaxed @3xl:grid-cols-4 ${className}`}
    >
      {cells.map((cell) => (
        <div key={cell.label} className="ns-hero-fade min-w-0">
          <dt className={`mb-1.5 opacity-70 ${label}`}>{cell.label}</dt>
          <dd className="[overflow-wrap:anywhere]">{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BigName({ name, className = "" }: { name: string; className?: string }) {
  const [first, rest] = nameLines(name);
  return (
    <span className={`block ${className}`}>
      <span className="ns-hero-line block overflow-hidden pr-[0.1em] pb-[0.06em]">
        <span className="block">{first}</span>
      </span>
      {rest && (
        <span className="ns-hero-line block overflow-hidden pr-[0.1em] pb-[0.06em] text-right">
          <span className="block">
            <Accent text={rest} />
          </span>
        </span>
      )}
    </span>
  );
}

function SignatureHero({
  model,
  data,
  variant,
  intro,
}: {
  model: SiteModel;
  data: SectionOf<"hero">;
  variant: Composition;
  intro: boolean;
}) {
  const { business } = model;
  const image = data.image;
  const introAttr = intro ? { "data-intro": "" } : {};

  // Foto de ponta a ponta com o nome gigante (imersiva e, com foto, a de serviço).
  if (image && (variant === "immersive" || variant === "service-led")) {
    return (
      <header
        {...introAttr}
        className="ns-hero relative isolate flex min-h-[max(40rem,100svh)] flex-col justify-end overflow-hidden text-ns-background"
      >
        <div
          className="absolute inset-x-0 -top-[6%] bottom-0 -z-10 bg-ns-text"
          data-ns-parallax="0.35"
        >
          <div data-kind={image.kind} className="ns-photo absolute inset-0 overflow-hidden">
            <Photo
              image={image}
              priority
              sizes="100vw"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
        <div aria-hidden="true" className="ns-hero-veil absolute inset-0 -z-10" />
        {image.credit && (
          <div className="absolute top-24 left-5 text-[0.6875rem] opacity-75 @min-[40rem]:left-8 @5xl:left-16 [&_a]:underline">
            <PhotoCredit image={image} />
          </div>
        )}
        <div className={`${wrap} pb-8 pt-40`}>
          <h1
            style={{ "--ns-name-scale": nameScale(business.name) } as CSSProperties}
            className={`${display} text-[length:calc(clamp(4.25rem,16.5cqw,20rem)*var(--ns-name-scale))] leading-[0.8] tracking-[-0.05em]`}
          >
            <BigName name={business.name} />
          </h1>
          <div className="mt-8 grid gap-8 border-t border-ns-background/35 pt-6 @5xl:grid-cols-12 @5xl:items-end">
            <p className="ns-hero-fade max-w-xl text-lg leading-relaxed opacity-90 @5xl:col-span-6">
              {data.subtitle}
            </p>
            <div className="ns-hero-fade @5xl:col-span-6 @5xl:justify-self-end">
              <Actions model={model} tone="light" />
            </div>
          </div>
          <HeroFacts model={model} className="mt-8 border-t border-ns-background/20 pt-6" />
          <HighlightList
            highlights={business.highlights}
            className="ns-hero-fade mt-6 opacity-85"
          />
        </div>
      </header>
    );
  }

  // Título com a foto alta ao lado (editorial).
  if (image && variant === "editorial") {
    return (
      <header
        {...introAttr}
        className={`ns-hero grid min-h-[100svh] gap-10 pt-32 pb-12 @5xl:grid-cols-12 @5xl:items-end ${wrap}`}
      >
        <div className="@5xl:col-span-7">
          <p className={`ns-hero-fade text-ns-muted ${label}`}>
            {[business.category, model.where].filter(Boolean).join(" · ")}
          </p>
          <h1
            className={`mt-8 ${display} text-[length:clamp(3.5rem,8.5cqw,9.5rem)] leading-[0.88] text-balance`}
          >
            <span className="ns-hero-line block overflow-hidden pb-[0.08em]">
              <span className="block">
                <Accent text={data.title} />
              </span>
            </span>
          </h1>
          <p className="ns-hero-fade mt-10 max-w-lg text-lg leading-relaxed text-ns-muted">
            {data.subtitle}
          </p>
          <div className="ns-hero-fade mt-10">
            <Actions model={model} tone="dark" />
          </div>
          <HighlightList
            highlights={business.highlights}
            className="ns-hero-fade mt-8 text-ns-muted"
          />
        </div>
        <figure className="@5xl:col-span-5">
          {/* Foto do LCP: sem revelação (não some nem pisca ao carregar), só a paralaxe. */}
          <div
            data-kind={image.kind}
            className="ns-photo relative aspect-[4/5] overflow-hidden bg-ns-surface"
          >
            <div className="absolute inset-[-8%_0]" data-ns-parallax="0.15">
              <Photo
                image={image}
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          </div>
          {image.credit && (
            <figcaption className="mt-3 text-xs text-ns-muted">
              <PhotoCredit image={image} />
            </figcaption>
          )}
        </figure>
      </header>
    );
  }

  // Nome enorme de ponta a ponta, a foto larga embaixo (modular).
  if (image && variant === "modular") {
    return (
      <header {...introAttr} className={`ns-hero pt-32 ${wrap}`}>
        <p className={`ns-hero-fade text-ns-muted ${label}`}>
          {[business.category, model.where].filter(Boolean).join(" · ")}
        </p>
        <h1
          style={{ "--ns-name-scale": nameScale(business.name) } as CSSProperties}
          className={`mt-6 ${display} text-[length:calc(clamp(3.75rem,13cqw,15rem)*var(--ns-name-scale))] leading-[0.82] tracking-[-0.05em]`}
        >
          <BigName name={business.name} />
        </h1>
        <div className="mt-10 grid gap-8 border-t border-ns-border pt-8 @5xl:grid-cols-12">
          <p className="ns-hero-fade font-ns-heading text-2xl leading-snug @5xl:col-span-5">
            {data.title}
          </p>
          <p className="ns-hero-fade max-w-md leading-relaxed text-ns-muted @5xl:col-span-4">
            {data.subtitle}
          </p>
          <div className="ns-hero-fade @5xl:col-span-3">
            <Actions model={model} tone="dark" stack />
          </div>
        </div>
        <HighlightList
          highlights={business.highlights}
          className="ns-hero-fade mt-6 text-ns-muted"
        />
        {/* Foto do LCP: sem revelação (não some nem pisca ao carregar), só a paralaxe. */}
        <div
          data-kind={image.kind}
          className="ns-photo relative mt-12 aspect-[4/3] overflow-hidden bg-ns-surface @3xl:aspect-[21/9]"
        >
          <div className="absolute inset-[-10%_0]" data-ns-parallax="0.25">
            <Photo
              image={image}
              priority
              sizes="100vw"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          {image.credit && (
            <div className="absolute right-3 bottom-3 rounded-sm bg-ns-background/85 px-2 py-1 text-[0.6875rem]">
              <PhotoCredit image={image} />
            </div>
          )}
        </div>
      </header>
    );
  }

  // Pôster tipográfico (sem foto, ou composição tipográfica): fundo escuro e o nome gigante.
  return (
    <header
      {...introAttr}
      className="ns-hero relative flex min-h-[max(38rem,100svh)] flex-col justify-end bg-ns-text text-ns-background"
    >
      <div className={`${wrap} pb-8 pt-40`}>
        <p className={`ns-hero-fade opacity-70 ${label}`}>
          {[business.category, model.where].filter(Boolean).join(" · ")}
        </p>
        <h1
          style={{ "--ns-name-scale": nameScale(business.name) } as CSSProperties}
          className={`mt-6 ${display} text-[length:calc(clamp(4rem,15cqw,18rem)*var(--ns-name-scale))] leading-[0.8] tracking-[-0.05em]`}
        >
          <BigName name={business.name} />
        </h1>
        <div className="mt-10 grid gap-8 border-t border-ns-background/25 pt-6 @5xl:grid-cols-12 @5xl:items-end">
          <p className="ns-hero-fade font-ns-heading text-2xl leading-snug @5xl:col-span-5">
            {data.title}
          </p>
          <p className="ns-hero-fade max-w-md leading-relaxed opacity-80 @5xl:col-span-4">
            {data.subtitle}
          </p>
          <div className="ns-hero-fade @5xl:col-span-3">
            <Actions model={model} tone="light" stack />
          </div>
        </div>
        <HighlightList highlights={business.highlights} className="ns-hero-fade mt-6 opacity-80" />
      </div>
      {image && (
        <div
          data-ns-reveal
          data-kind={image.kind}
          className="ns-photo relative aspect-[16/9] overflow-hidden @5xl:aspect-[21/8]"
        >
          <div className="absolute inset-[-10%_0]" data-ns-parallax="0.3">
            <Photo
              image={image}
              sizes="100vw"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      )}
    </header>
  );
}

/** Quem somos: a frase grande que acende palavra por palavra, as pessoas e duas fotos. */
function Statement({
  id,
  model,
  data,
  pool,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"about">;
  pool: SiteImage[];
}) {
  const people = (data.people ?? []).filter((p) => p.name.trim());
  const duo = pool.slice(1, 3);
  return (
    <section id={id} className="scroll-mt-28">
      <div className={`grid gap-8 py-(--ns-section-y) @5xl:grid-cols-12 ${wrap}`}>
        <h2 data-ns-fade className={`text-ns-muted @5xl:col-span-3 @5xl:pt-4 ${label}`}>
          {model.titleOf(data)}
        </h2>
        <p
          data-ns-words
          className={`${display} text-[length:clamp(2rem,4.3cqw,4.5rem)] leading-[1.06] tracking-[-0.025em] whitespace-pre-line @5xl:col-span-9`}
        >
          {data.body}
        </p>
      </div>
      {duo.length === 2 && (
        <div className={`grid items-start gap-6 pb-(--ns-section-y) @3xl:grid-cols-12 ${wrap}`}>
          {duo.map((image, i) => (
            <figure
              key={image.url}
              className={
                i === 0 ? "@3xl:col-span-7" : "@3xl:col-span-4 @3xl:col-start-9 @3xl:mt-[30%]"
              }
            >
              <div
                data-ns-reveal
                data-kind={image.kind}
                className={`ns-photo relative overflow-hidden bg-ns-surface ${i === 0 ? "aspect-[4/5]" : "aspect-[3/4]"}`}
              >
                <div
                  className="absolute inset-[-10%_0]"
                  data-ns-parallax={i === 0 ? "0.12" : "0.22"}
                >
                  <Photo
                    image={image}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              </div>
              {(image.caption || image.credit) && (
                <figcaption className="mt-3 flex justify-between gap-4 text-xs text-ns-muted">
                  <span>{image.caption}</span>
                  {image.credit && <PhotoCredit image={image} />}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      {people.length > 0 && (
        <div className={`grid gap-8 pb-(--ns-section-y) @5xl:grid-cols-12 ${wrap}`}>
          <p className={`text-ns-muted @5xl:col-span-3 @5xl:pt-6 ${label}`}>{model.words.about}</p>
          <ul className="border-b border-ns-border @5xl:col-span-9">
            {people.map((person, i) => (
              <li
                key={`${person.name}-${i}`}
                data-ns-rise
                className="grid gap-2 border-t border-ns-border py-7 @3xl:grid-cols-2 @3xl:items-baseline @3xl:gap-8"
              >
                <h3 className={`${display} text-[length:clamp(2rem,3.6cqw,3.75rem)] leading-none`}>
                  {person.name}
                </h3>
                <p className="text-sm leading-relaxed text-ns-muted">
                  {person.role && (
                    <span className="mb-1 block font-medium text-ns-text">{person.role}</span>
                  )}
                  {person.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

type ServiceItem = SectionOf<"services">["items"][number];
type ServiceEntry = { item: ServiceItem; n: number };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Serviços: faixa corrida e a lista grande num bloco escuro. Itens com foto (`item.image`, foto
 * de banco "scene" ou do dono) viram cartões com foto, num arranjo diferente por composição
 * (ver ServiceCards); itens sem foto continuam na lista, com a foto que segue o mouse. Sem
 * nenhuma foto nos itens, a seção fica como sempre foi.
 */
function ServiceIndex({
  id,
  model,
  data,
  pool,
  variant,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"services">;
  pool: SiteImage[];
  variant: Composition;
}) {
  if (data.items.length === 0) return null;
  const names = serviceNames(model);
  // Foto de cada nome na faixa corrida (no lugar da estrela).
  const thumbs = new Map<string, SiteImage>();
  for (const item of data.items) if (item.image) thumbs.set(item.name.trim(), item.image);
  const groups: { name?: string; entries: ServiceEntry[] }[] = [];
  data.items.forEach((item, i) => {
    const name = item.group?.trim() || undefined;
    const last = groups.at(-1);
    const entry = { item, n: i + 1 };
    if (last && last.name === name) last.entries.push(entry);
    else groups.push({ name, entries: [entry] });
  });
  // Tipográfica: tudo em lista (a letra manda); a foto entra como uma pílula no nome.
  const listOnly = variant === "typographic";
  const rowsOf = (entries: ServiceEntry[]) =>
    listOnly ? entries : entries.filter((entry) => !entry.item.image);
  const rows = groups.flatMap((group) => rowsOf(group.entries));
  // Foto que segue o mouse: a do próprio item; sem ela, uma das fotos do site.
  const floatImages =
    pool.length > 0
      ? rows.map((entry, i) => entry.item.image ?? pool[i % pool.length] ?? pool[0])
      : rows.every((entry) => entry.item.image)
        ? rows.map((entry) => entry.item.image)
        : [];
  const floating = floatImages.filter((image): image is SiteImage => Boolean(image));
  return (
    <section id={id} className="scroll-mt-28">
      {names.length >= 3 && (
        <div aria-hidden="true" className="ns-marquee border-y border-ns-border py-6">
          <div
            className={`ns-marquee-track ${display} text-[length:clamp(2.75rem,7cqw,7.5rem)] leading-none`}
          >
            {[0, 1].map((copy) =>
              names.map((name, i) => {
                const thumb = thumbs.get(name);
                return (
                  <span key={`${copy}-${i}`} className="flex items-center">
                    <span className="px-[0.3em]">{name}</span>
                    {thumb ? (
                      <span
                        data-kind={thumb.kind}
                        className="ns-photo relative mx-[0.15em] inline-block h-[0.78em] w-[1.25em] overflow-hidden rounded-full bg-ns-surface"
                      >
                        <Photo
                          image={thumb}
                          sizes="160px"
                          className="absolute inset-0 size-full object-cover"
                        />
                      </span>
                    ) : (
                      <span className="text-[0.4em] text-ns-primary">✦</span>
                    )}
                  </span>
                );
              }),
            )}
          </div>
        </div>
      )}
      <div
        data-ns-float
        className={`relative bg-ns-text py-(--ns-section-y) text-ns-background ${wrap}`}
      >
        <div className="mb-14 flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <h2
            data-ns-rise
            className={`${display} text-[length:clamp(3.5rem,9.5cqw,10rem)] leading-[0.85] tracking-[-0.045em]`}
          >
            <Accent text={model.titleOf(data)} />
          </h2>
        </div>
        {groups.map((group, g) => {
          const level = group.name ? "h4" : "h3";
          const cards = listOnly ? [] : group.entries.filter((entry) => entry.item.image);
          const list = rowsOf(group.entries);
          return (
            <div key={`${group.name ?? "items"}-${g}`} className="mt-12 first:mt-0">
              {group.name && <h3 className={`mb-3 opacity-55 ${label}`}>{group.name}</h3>}
              <ServiceCards entries={cards} variant={variant} level={level} />
              {list.length > 0 && (
                <ul className={`border-b border-ns-background/15 ${cards.length ? "mt-12" : ""}`}>
                  {list.map(({ item, n }) => (
                    <ServiceRow key={`${item.name}-${n}`} item={item} n={n} level={level} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {floating.length > 0 && (
          <div
            aria-hidden="true"
            data-ns-float-box
            className="ns-float pointer-events-none fixed top-0 left-0 z-30"
          >
            <div className="ns-float-inner relative aspect-[4/5] w-72 overflow-hidden rounded-sm">
              {floating.map((image, i) => (
                <div
                  key={`${image.url}-${i}`}
                  data-ns-float-img
                  className="absolute inset-0"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <Photo
                    image={image}
                    sizes="288px"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Linha da lista de serviços (número, nome grande, descrição, preço). */
function ServiceRow({ item, n, level }: ServiceEntry & { level: "h3" | "h4" }) {
  const Heading = level;
  return (
    <li
      data-ns-float-row
      data-ns-rise
      className="ns-row group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-ns-background/15 py-6 @3xl:grid-cols-[4rem_1fr_1.1fr_10rem]"
    >
      <span className="hidden text-xs tabular-nums opacity-50 @3xl:block">{pad(n)}</span>
      <Heading
        className={`${display} text-[length:clamp(1.75rem,3.4cqw,3.5rem)] leading-none transition duration-700 group-hover:translate-x-4 motion-reduce:transition-none`}
      >
        {item.name}
        {item.image && (
          // Pílula de foto no fim do nome (composição tipográfica: a letra continua mandando).
          <span
            aria-hidden="true"
            data-kind={item.image.kind}
            className="ns-photo ns-card-pill relative ml-[0.3em] inline-block h-[0.8em] w-[1.5em] overflow-hidden rounded-full bg-ns-background/10 align-[-0.06em]"
          >
            <Photo
              image={item.image}
              sizes="120px"
              className="ns-card-img absolute inset-0 size-full object-cover"
            />
          </span>
        )}
      </Heading>
      <div className="col-span-2 @3xl:col-span-1">
        <p className="text-sm leading-relaxed opacity-70">{item.description}</p>
        {item.image && (
          <PhotoCredit image={item.image} className="mt-2 text-[0.6875rem] opacity-55" />
        )}
      </div>
      {(item.price || item.detail) && (
        <p className="row-start-1 text-right text-[0.9375rem] tabular-nums @3xl:row-auto">
          {item.price}
          {item.detail && <span className="mt-1 block text-xs opacity-55">{item.detail}</span>}
        </p>
      )}
    </li>
  );
}

/** Moldura de foto dos cartões: carrega sob demanda, assenta com a rolagem e cresce no hover. */
function CardPhoto({
  image,
  sizes,
  className = "",
}: {
  image: SiteImage;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      data-kind={image.kind}
      className={`ns-photo relative overflow-hidden bg-ns-background/10 ${className}`}
    >
      <div data-ns-zoom className="absolute inset-0">
        <Photo
          image={image}
          sizes={sizes}
          className="ns-card-img absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  );
}

/** Nome, preço, descrição e crédito da foto de um cartão. */
function CardText({
  item,
  n,
  level,
  big = false,
  credit = true,
}: ServiceEntry & { level: "h3" | "h4"; big?: boolean; credit?: boolean }) {
  const Heading = level;
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <Heading
          className={`${display} leading-[1.02] ${big ? "text-[length:clamp(2.25rem,4.4cqw,4.5rem)]" : "text-[length:clamp(1.625rem,2.4cqw,2.5rem)]"}`}
        >
          <span
            aria-hidden="true"
            className="mr-3 align-top font-ns-body text-xs tracking-normal tabular-nums opacity-50"
          >
            {pad(n)}
          </span>
          {item.name}
        </Heading>
        {item.price && <p className="shrink-0 text-[0.9375rem] tabular-nums">{item.price}</p>}
      </div>
      {item.detail && <p className="mt-1 text-xs opacity-55">{item.detail}</p>}
      <p className="mt-3 max-w-prose text-sm leading-relaxed opacity-70">{item.description}</p>
      {credit && item.image && (
        <PhotoCredit image={item.image} className="mt-4 text-[0.6875rem] opacity-55" />
      )}
    </>
  );
}

/**
 * Cartões com foto dos serviços. Cada composição tem um ritmo próprio:
 * - service-led: grade de cartões (2 ou 3 colunas, pela quantidade);
 * - editorial: faixas de foto e texto alternando os lados;
 * - immersive: fotos grandes com o texto por cima (a primeira de ponta a ponta se sobrar uma);
 * - modular: mosaico (bento), a primeira foto ocupando dois andares.
 */
function ServiceCards({
  entries,
  variant,
  level,
}: {
  entries: ServiceEntry[];
  variant: Composition;
  level: "h3" | "h4";
}) {
  if (entries.length === 0) return null;
  const count = entries.length;

  if (variant === "editorial" || count === 1) {
    return (
      <ul className="grid gap-16 @3xl:gap-24">
        {entries.map((entry, i) => {
          const flip = i % 2 === 1;
          const image = entry.item.image;
          if (!image) return null;
          return (
            <li
              key={`${entry.item.name}-${entry.n}`}
              data-ns-fade
              className="ns-card grid items-center gap-6 @3xl:grid-cols-12 @3xl:gap-10"
            >
              <CardPhoto
                image={image}
                sizes="(min-width: 768px) 58vw, 100vw"
                className={`aspect-[4/3] @3xl:col-span-7 @3xl:row-start-1 ${flip ? "@3xl:col-start-6" : "@3xl:col-start-1"}`}
              />
              <div
                className={`@3xl:col-span-4 @3xl:row-start-1 ${flip ? "@3xl:col-start-1" : "@3xl:col-start-9"}`}
              >
                <CardText {...entry} level={level} big />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (variant === "immersive") {
    const featureFirst = count % 2 === 1;
    return (
      <ul data-ns-stagger className="grid gap-4 @3xl:grid-cols-2 @3xl:gap-5">
        {entries.map((entry, i) => {
          const image = entry.item.image;
          if (!image) return null;
          const feature = featureFirst && i === 0;
          return (
            <li key={`${entry.item.name}-${entry.n}`} className={feature ? "@3xl:col-span-2" : ""}>
              <figure className="ns-card relative isolate overflow-hidden">
                <CardPhoto
                  image={image}
                  sizes={feature ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
                  className={`aspect-[4/5] ${feature ? "@3xl:aspect-[21/9]" : "@5xl:aspect-[6/5]"}`}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ns-text/90 via-ns-text/25 to-transparent"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-6 @3xl:p-8">
                  <CardText {...entry} level={level} big={feature} credit={false} />
                </figcaption>
              </figure>
              <PhotoCredit image={image} className="mt-2 text-[0.6875rem] opacity-55" />
            </li>
          );
        })}
      </ul>
    );
  }

  if (variant === "modular") {
    const bento = count >= 3;
    return (
      <ul data-ns-stagger className="grid gap-3 @3xl:grid-cols-2 @5xl:grid-cols-4">
        {entries.map((entry, i) => {
          const image = entry.item.image;
          if (!image) return null;
          const big = bento && i === 0;
          return (
            <li
              key={`${entry.item.name}-${entry.n}`}
              className={`ns-card flex flex-col border border-ns-background/15 p-3 ${big ? "@5xl:col-span-2 @5xl:row-span-2" : ""}`}
            >
              <CardPhoto
                image={image}
                sizes={
                  big
                    ? "(min-width: 1024px) 50vw, 100vw"
                    : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                }
                className={`aspect-[4/3] ${big ? "@5xl:aspect-auto @5xl:min-h-[22rem] @5xl:flex-1" : ""}`}
              />
              <div className="px-2 pt-5 pb-2">
                <CardText {...entry} level={level} big={big} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  // service-led (e qualquer outra): grade de cartões.
  const two = count === 2 || count === 4;
  return (
    <ul
      data-ns-stagger
      className={`grid gap-x-6 gap-y-14 @3xl:grid-cols-2 ${two ? "" : "@5xl:grid-cols-3"}`}
    >
      {entries.map((entry) => {
        const image = entry.item.image;
        if (!image) return null;
        return (
          <li key={`${entry.item.name}-${entry.n}`} className="ns-card">
            <CardPhoto
              image={image}
              sizes={
                two
                  ? "(min-width: 768px) 50vw, 100vw"
                  : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              }
              className={two ? "aspect-[4/3]" : "aspect-[4/5]"}
            />
            <div className="mt-6">
              <CardText {...entry} level={level} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Galeria: no site de verdade, corre de lado com a rolagem; no editor, uma grade simples. */
function Rail({
  id,
  model,
  data,
  motion,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"gallery">;
  motion: boolean;
}) {
  const images = data.images.filter((image) => isOwnerPhoto(image));
  if (images.length === 0) return null;
  const widths = ["w-[62vh]", "w-[92vh]", "w-[46vh]"];
  const head = (
    <div className={`mb-8 flex items-baseline justify-between gap-6 ${wrap}`}>
      <h2
        data-ns-fade
        className={`${display} text-[length:clamp(2.75rem,6cqw,6.5rem)] leading-[0.9]`}
      >
        <Accent text={model.titleOf(data)} />
      </h2>
      <p className={`hidden text-ns-muted @3xl:block ${label}`}>
        {String(images.length).padStart(2, "0")} photos
      </p>
    </div>
  );
  const credits = images.filter((i) => i.credit);
  return (
    <section
      id={id}
      data-gallery="rail"
      data-ns-hscroll={motion ? "" : undefined}
      className={`scroll-mt-28 ${motion ? "ns-hscroll" : "py-(--ns-section-y)"}`}
    >
      <div className={motion ? "ns-hscroll-sticky" : ""}>
        {head}
        <ul
          className={`ns-rail flex gap-6 ${motion ? "pl-5 @min-[40rem]:pl-8 @5xl:pl-16" : `overflow-x-auto pb-4 ${wrap}`}`}
        >
          {images.map((image, i) => (
            <li
              key={`${image.url}-${i}`}
              className={`shrink-0 ${motion ? widths[i % 3] : "w-[78%] @3xl:w-[42%]"}`}
            >
              <figure>
                <div
                  data-kind="owner"
                  className={`ns-photo relative overflow-hidden bg-ns-surface ${motion ? "h-[56vh]" : "aspect-[4/3]"}`}
                >
                  <Photo
                    image={image}
                    sizes="(min-width: 1024px) 60vw, 80vw"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 flex gap-4 text-xs text-ns-muted">
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {image.caption && <span>{image.caption}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        {credits.length > 0 && (
          <div
            className={`mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-ns-muted ${wrap}`}
          >
            {credits.map((image) => (
              <PhotoCredit key={image.url} image={image} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Depoimentos grandes em itálico (trocam sozinhos no site; sem movimento, um embaixo do outro). */
function Quotes({
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
    <section
      id={id}
      className={`scroll-mt-28 border-t border-ns-border py-(--ns-section-y) text-center ${wrap}`}
    >
      <h2 data-ns-fade className={`mb-12 text-ns-muted ${label}`}>
        {model.titleOf(data)}
      </h2>
      <div data-ns-quotes data-ns-fade className="ns-quotes">
        {data.items.map((item, i) => (
          <figure key={`${item.author}-${i}`} data-ns-quote className="ns-quote">
            <blockquote
              className={`mx-auto max-w-[18ch] ${display} text-[length:clamp(2rem,4.6cqw,4.75rem)] leading-[1.05] italic`}
            >
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className={`mt-7 text-ns-muted ${label}`}>{item.author}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Agendar: foto de fundo, título enorme, botão de vidro magnético e o formulário embaixo. */
function Booking({
  id,
  model,
  data,
  pool,
  endpoint,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"contact">;
  pool: SiteImage[];
  endpoint?: string;
}) {
  const { business, phoneHref, ctaHref, ctaLabel, ctaExternal } = model;
  // Fundo: a última foto do dono; com só a foto do topo, a primeira foto de serviço (para não
  // repetir a do topo), senão a do topo.
  const serviceShot = model.spec.sections
    .flatMap((section) => (section.type === "services" ? section.items.map((i) => i.image) : []))
    .find((image): image is SiteImage => Boolean(image));
  const backdrop = pool.length > 1 ? pool.at(-1) : (serviceShot ?? pool[0]);
  const hours = business.hours?.length ? business.hours : null;
  const callHref = phoneHref ?? (ctaExternal ? ctaHref : undefined);
  return (
    <section id={id} className="scroll-mt-28">
      <div className="relative isolate grid min-h-[90svh] place-content-center justify-items-center overflow-hidden bg-ns-text px-5 py-28 text-center text-ns-background">
        {backdrop && (
          <div className="absolute inset-x-0 -inset-y-[10%] -z-10" data-ns-parallax="0.25">
            <div data-kind={backdrop.kind} className="ns-photo absolute inset-0">
              <Photo
                image={backdrop}
                sizes="100vw"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          </div>
        )}
        <div aria-hidden="true" className="ns-booking-veil absolute inset-0 -z-10" />
        {model.where && <p className={`mb-7 opacity-75 ${label}`}>{model.where}</p>}
        <h2
          data-ns-rise
          className={`${display} text-[length:clamp(3.75rem,11cqw,13rem)] leading-[0.85] tracking-[-0.05em] text-balance`}
        >
          <Accent text={model.titleOf(data)} />
        </h2>
        {callHref && (
          <a
            href={callHref}
            {...externalProps(callHref)}
            data-ns-magnetic
            className={`ns-glass relative mt-12 inline-flex min-h-14 items-center gap-3 rounded-full px-9 text-base font-medium text-ns-text ${focus}`}
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-ns-primary" />
            {phoneHref && business.phone ? `Call ${business.phone}` : ctaLabel}
          </a>
        )}
        <dl
          data-ns-stagger
          className="mt-16 flex flex-wrap justify-center gap-x-14 gap-y-5 text-sm"
        >
          {hours && (
            <div>
              <dt className={`mb-1.5 opacity-65 ${label}`}>Hours</dt>
              <dd className="tabular-nums">{hoursSummary(hours)}</dd>
            </div>
          )}
          {business.address && (
            <div>
              <dt className={`mb-1.5 opacity-65 ${label}`}>Address</dt>
              <dd>{business.address}</dd>
            </div>
          )}
          {business.email && (
            <div>
              <dt className={`mb-1.5 opacity-65 ${label}`}>Email</dt>
              <dd>
                <a
                  href={`mailto:${business.email}`}
                  className={`[overflow-wrap:anywhere] underline-offset-4 hover:underline ${focus}`}
                >
                  {business.email}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
      {data.showForm && (
        <div
          data-ns-stagger
          className={`grid gap-12 py-(--ns-section-y) @5xl:grid-cols-12 ${wrap}`}
        >
          <div className="@5xl:col-span-4">
            <p className={`text-ns-muted ${label}`}>{ctaLabel}</p>
            <p
              className={`mt-5 ${display} text-[length:clamp(2rem,3.4cqw,3.25rem)] leading-[1.05]`}
            >
              <Accent text="Send us a note" />
            </p>
            <ContactLines model={model} className="mt-10" />
            {hours && <HoursTable hours={hours} className="sr-only" />}
          </div>
          <ContactFormBlock
            data={data}
            model={model}
            endpoint={endpoint}
            radius="md"
            framed={false}
            className="@5xl:col-span-7 @5xl:col-start-6"
          />
        </div>
      )}
    </section>
  );
}

/** Rodapé com o nome enorme de ponta a ponta. */
function GiantFooter({ model, pool }: { model: SiteModel; pool: SiteImage[] }) {
  const { business, links, phoneHref } = model;
  const city = location(business);
  const hours = hoursSummary(business.hours);
  const socials = socialLinks(business);
  const credits = pool.filter((image) => image.credit);
  const year = new Date().getFullYear();
  return (
    <footer className="overflow-hidden bg-ns-text pt-20 pb-[calc(6rem+env(safe-area-inset-bottom))] text-ns-background @3xl:pb-0">
      <div
        data-ns-stagger
        className={`grid grid-cols-2 gap-8 text-sm leading-relaxed @5xl:grid-cols-4 ${wrap}`}
      >
        {(business.address || city) && (
          <div>
            <p className={`mb-3 opacity-55 ${label}`}>Visit</p>
            <p>
              {business.address && <span className="block">{business.address}</span>}
              {city}
            </p>
          </div>
        )}
        {hours && (
          <div>
            <p className={`mb-3 opacity-55 ${label}`}>Hours</p>
            <p className="tabular-nums">{hours}</p>
          </div>
        )}
        <div>
          <p className={`mb-3 opacity-55 ${label}`}>Contact</p>
          {business.phone && phoneHref && (
            <a href={phoneHref} className={`block tabular-nums ${focus}`}>
              {business.phone}
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className={`block [overflow-wrap:anywhere] ${focus}`}
            >
              {business.email}
            </a>
          )}
          <ReviewUsLink business={business} className="mt-4" />
        </div>
        {(links.length > 0 || socials.length > 0) && (
          <div>
            <p className={`mb-3 opacity-55 ${label}`}>Menu</p>
            <ul>
              {links.map((link) => (
                <li key={link.anchor}>
                  <a
                    href={`#${link.anchor}`}
                    className={`inline-flex min-h-8 items-center opacity-85 hover:opacity-100 ${focus}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    {...externalProps(social.href)}
                    className={`inline-flex min-h-8 items-center opacity-85 hover:opacity-100 ${focus}`}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p
        aria-hidden="true"
        data-ns-giant
        className={`mt-16 px-2 ${display} text-[length:clamp(3.5rem,19cqw,22rem)] leading-[0.78] tracking-[-0.055em] whitespace-nowrap`}
      >
        {business.name}
      </p>
      <div
        className={`flex flex-col gap-2 border-t border-ns-background/15 py-5 text-[0.6875rem] opacity-60 @3xl:flex-row @3xl:justify-between ${wrap}`}
      >
        <span>
          &copy; {year} {business.name}
        </span>
        {credits.length > 0 && (
          <span>Photos: {Array.from(new Set(credits.map((i) => i.credit?.name))).join(", ")}</span>
        )}
        <span className="flex gap-4">
          <span>Website by No Sweat</span>
          <a
            href={VISITOR_PRIVACY_URL}
            target="_blank"
            rel="noopener"
            className={`underline-offset-2 hover:underline ${focus}`}
          >
            Privacy<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      </div>
    </footer>
  );
}
