import type { Composition, Section, SectionOf, SiteImage } from "@nosweat/schema";
import type { CSSProperties, ReactNode } from "react";
import { PauseIcon, PhoneIcon, PlayIcon } from "../components/icons";
import { Photo, PhotoCredits, specImages } from "../components/photo";
import { BookingSection } from "../sections/BookingSection";
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
import { heroTone, tonesOf, type Tone } from "./tone";

// Molde SIGNATURE: o padrão de site premiado aprovado pelo dono (protótipo do Still Water Spa).
// Uma arquitetura só, com o topo num de 5 formatos (um por composição do plano de design) e as
// peças premium em todas: abertura, menu de vidro, frase que acende, fotos com movimento, lista
// de serviços, galeria que corre de lado e rodapé gigante.
// O movimento (Motion.tsx) só liga no site de verdade: no editor e nas miniaturas fica parado.

const wrap = "w-full px-5 @min-[40rem]:px-8 @5xl:px-16";
const label = "text-[0.6875rem] tracking-[0.22em] uppercase";
const display = "font-ns-heading font-ns-display tracking-[-0.035em]";

/**
 * Título com a última palavra em destaque ("Before your *visit*"). Itálico só nas fontes que têm
 * itálico de verdade (styles.css, `.ns-accent`); nas outras vira a cor principal.
 */
function Accent({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em className="ns-accent">{last}</em>
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
  bookingEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);
  const motion = anchors && !editable;
  const pool = photoPool(model);
  const composition: Composition = spec.design?.composition ?? "service-led";
  // Tom de cada faixa (menu de vidro adaptativo, ver tone.ts): o topo, as faixas na cor do texto
  // (serviços, agendar, rodapé) e o resto da página no fundo do tema.
  const tones = tonesOf(spec.theme);
  const topTone = model.hero ? heroTone(composition, Boolean(model.hero.image), tones) : tones.page;

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
            tone={heroTone(composition, Boolean(section.image), tones)}
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
            variant={composition}
            bandTone={tones.band}
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
      case "booking":
        // Agendamento: o título vem daqui (servidor); o seletor busca os horários no navegador.
        return (
          <BookingSection
            key={key}
            id={id}
            endpoint={bookingEndpoint}
            editable={editable}
            intro={section.intro}
            phone={model.business.phone}
            phoneHref={model.phoneHref}
            className={`scroll-mt-28 py-(--ns-section-y) ${wrap}`}
            heading={
              <h2
                data-ns-rise
                className={`${display} text-[length:clamp(2.75rem,5cqw,5.25rem)] leading-[0.95]`}
              >
                <Accent text={model.titleOf(section)} />
              </h2>
            }
          />
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
            <Booking
              id={id}
              model={model}
              data={section}
              pool={pool}
              endpoint={contactEndpoint}
              bandTone={tones.band}
            />
          </div>
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  const opening = motion && Boolean(model.hero);
  return (
    <div
      id={anchors ? "top" : undefined}
      className="relative flex min-h-full flex-col overflow-x-clip"
      // O script da abertura põe `data-ns-opening` aqui antes da hidratação (ver OPENING_SCRIPT).
      suppressHydrationWarning={opening || undefined}
    >
      {opening && (
        <>
          {/* Antes da pintura: decide se a abertura toca (primeira visita da sessão). */}
          <script dangerouslySetInnerHTML={{ __html: OPENING_SCRIPT }} />
          <Intro name={model.business.name} place={model.where} />
        </>
      )}
      {anchors && <SkipLink />}
      <SiteNav model={model} tone={topTone} atTop={motion} />
      <main
        id={anchors ? "main" : undefined}
        tabIndex={anchors ? -1 : undefined}
        className="flex-1"
      >
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <GiantFooter model={model} bandTone={tones.band} />
      <MobileCallBar model={model} radius="rounded-full" />
      {motion && <Motion pageTone={tones.page} />}
    </div>
  );
}

/**
 * Link "Skip to content" (WCAG 2.4.1): o primeiro item focável da página, antes do menu de vidro.
 * Fica fora da tela até receber o foco do teclado; leva o foco para o `<main id="main">`.
 */
function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-[70] inline-flex min-h-11 -translate-y-[200%] items-center rounded-full bg-ns-text px-5 text-sm font-medium text-ns-background transition-transform focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-text motion-reduce:transition-none"
    >
      Skip to content
    </a>
  );
}

/** Chave do sessionStorage que marca a abertura como vista (uma por endereço, por sessão). */
const OPENING_KEY = "ns-opened:";

/**
 * Script da abertura, no começo do site e antes da cortina: roda antes da pintura e liga
 * `data-ns-opening` no wrapper do molde só na PRIMEIRA visita da sessão a este endereço. Visita
 * repetida, "reduzir movimento" ou sessionStorage bloqueado (exceção) = sem cortina. Sem
 * JavaScript o atributo nunca aparece e a cortina não existe (styles.css, .ns-intro).
 */
export const OPENING_SCRIPT = `(function(){try{var r=document.currentScript.parentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var k=${JSON.stringify(OPENING_KEY)}+location.pathname;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");r.setAttribute("data-ns-opening","")}catch(e){}})()`;

/** Atraso de cada letra da abertura: 20 ms por letra, no máximo 100 ms (nome comprido não atrasa). */
const introDelay = (index: number) => `${Math.min(index * 0.02, 0.1).toFixed(2)}s`;

/**
 * Abertura: o nome sobe letra por letra e a cortina sobe. Só CSS (styles.css, .ns-intro), tudo
 * em até 0,6 s para não atrasar o topo (LCP). Só toca quando OPENING_SCRIPT liga
 * `data-ns-opening` (uma vez por sessão; nunca com "reduzir movimento").
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
 * Cabeçalho do site: uma barra presa no alto, de ponta a ponta (nada de cápsula flutuando).
 * - sobre o topo da página (`data-top`): transparente, com a letra no tom do que está por baixo
 *   (`data-tone`, claro ou escuro) e uma sombra suave atrás para ler sobre qualquer foto;
 * - depois de rolar: fundo do tema, linha fina embaixo e a letra na cor do texto do tema
 *   (styles.css, "Cabeçalho"). A troca é só de cor: a barra nunca muda de tamanho.
 * Larguras (do site, não da janela: @container):
 * - celular e tablet (< 64rem): nome à esquerda; à direita o botão "Call now" (ou a ação principal,
 *   sem telefone) e o botão de menu, que abre um painel de ponta a ponta embaixo da barra;
 * - computador (>= 64rem): nome, links, telefone em texto e o botão da ação principal. O menu só
 *   existe no formato "minimal" (sem links em linha). "centered" põe o nome no meio (>= 80rem).
 */
/** Botão cheio do cabeçalho; as cores vêm do CSS (`.ns-nav-btn`), que acompanha o tom da barra. */
const navBtn =
  "ns-nav-btn h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition hover:opacity-90 motion-reduce:transition-none @7xl:h-11 @7xl:px-5 @7xl:text-[0.9375rem]";

function SiteNav({
  model,
  tone,
  atTop,
}: {
  model: SiteModel;
  tone: Tone;
  /** A página começa no topo e o Motion acompanha a rolagem. Sem ele (editor), a barra é sólida. */
  atTop: boolean;
}) {
  const { business, links, ctaHref, ctaLabel, ctaExternal, phoneHref } = model;
  const centered = model.style.header === "centered";
  // "minimal" nunca mostra os links em linha: tudo fica no botão de menu.
  const inline = model.style.header !== "minimal" && links.length > 0;
  const hasPhone = Boolean(phoneHref && business.phone);
  // Sem links em linha, o botão da ação principal só cabe a partir do tablet; com links, só no
  // computador (no celular e no tablet o "Call now" faz o papel dele).
  const ctaFrom = inline ? "@5xl:inline-flex" : "@3xl:inline-flex";

  const cta = (
    <a
      href={ctaHref}
      {...externalProps(ctaHref)}
      className={`${navBtn} max-w-[14rem] truncate ${hasPhone ? `hidden ${ctaFrom}` : "inline-flex"} ${focus}`}
    >
      {ctaLabel}
    </a>
  );
  const callNow = hasPhone ? (
    <a
      href={phoneHref}
      aria-label={`Call ${business.phone}`}
      className={`${navBtn} inline-flex ${inline ? "@5xl:hidden" : "@3xl:hidden"} ${focus}`}
    >
      <PhoneIcon className="size-4 shrink-0" />
      Call now
    </a>
  ) : null;
  const phone =
    hasPhone && inline ? (
      <a
        href={phoneHref}
        className={`ns-nav-link hidden items-center gap-2 text-sm tabular-nums @5xl:inline-flex ${focus}`}
      >
        <PhoneIcon className="size-4 shrink-0" />
        {business.phone}
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
              className={`ns-nav-link inline-flex min-h-11 items-center whitespace-nowrap ${focus}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ) : null;

  return (
    <header
      data-tone={tone}
      data-top={atTop ? "" : undefined}
      className="ns-nav fixed inset-x-0 top-0 z-40"
    >
      <div className="ns-navbar relative">
        <div
          className={`mx-auto flex h-16 w-full min-w-0 items-center gap-3 px-4 @3xl:px-8 @7xl:h-[4.5rem] @7xl:gap-8 @7xl:px-16 ${centered ? "@7xl:grid @7xl:grid-cols-[1fr_auto_1fr]" : ""}`}
        >
          <a
            href="#top"
            className={`ns-nav-name min-w-0 flex-1 truncate py-3 ${display} text-lg leading-none @min-[40rem]:text-xl @7xl:text-2xl ${centered ? "@7xl:col-start-2 @7xl:row-start-1 @7xl:flex-none @7xl:text-center" : ""} ${focus}`}
          >
            {business.name}
          </a>
          {menu}
          <div
            className={`flex shrink-0 items-center gap-2 @3xl:gap-4 @7xl:gap-6 ${centered ? "@7xl:col-start-3 @7xl:row-start-1 @7xl:justify-self-end" : ""}`}
          >
            {phone}
            {callNow}
            {cta}
            {menuButton}
          </div>
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
  tone,
  intro,
}: {
  model: SiteModel;
  data: SectionOf<"hero">;
  variant: Composition;
  /** Tom do topo, lido pelo menu de vidro (data-tone). */
  tone: Tone;
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
        data-tone={tone}
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
        data-tone={tone}
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
        </figure>
      </header>
    );
  }

  // Nome enorme de ponta a ponta, a foto larga embaixo (modular).
  if (image && variant === "modular") {
    return (
      <header {...introAttr} data-tone={tone} className={`ns-hero pt-32 ${wrap}`}>
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
        </div>
      </header>
    );
  }

  // Pôster tipográfico (sem foto, ou composição tipográfica): fundo escuro e o nome gigante.
  return (
    <header
      {...introAttr}
      data-tone={tone}
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
              {image.caption && (
                <figcaption className="mt-3 text-xs text-ns-muted">{image.caption}</figcaption>
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
  variant,
  bandTone,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"services">;
  variant: Composition;
  bandTone: Tone;
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
        data-tone={bandTone}
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
      </div>
    </section>
  );
}

/** Linha da lista de serviços (número, nome grande, descrição, preço). */
function ServiceRow({ item, n, level }: ServiceEntry & { level: "h3" | "h4" }) {
  const Heading = level;
  return (
    <li
      data-ns-rise
      className="ns-row group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-ns-background/15 py-6 @3xl:grid-cols-[4rem_1fr_1.1fr_10rem]"
    >
      <span className="hidden text-xs tabular-nums opacity-50 @3xl:block">{pad(n)}</span>
      <Heading className={`${display} text-[length:clamp(1.75rem,3.4cqw,3.5rem)] leading-none`}>
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

/** Nome, preço e descrição de um cartão (o crédito da foto fica só no rodapé). */
function CardText({
  item,
  n,
  level,
  big = false,
}: ServiceEntry & { level: "h3" | "h4"; big?: boolean }) {
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
                  <CardText {...entry} level={level} big={feature} />
                </figcaption>
              </figure>
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

/**
 * Galeria que corre de lado. Base (celular, tablet, sem JavaScript, "reduzir movimento", editor):
 * uma faixa que se arrasta com o dedo, com encaixe (snap). No computador, com movimento ligado, o
 * Motion.tsx marca a seção com `data-ns-on` e ela fica presa enquanto a rolagem vertical empurra
 * as fotos para o lado (styles.css, "Galeria que corre de lado").
 */
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
  return (
    <section
      id={id}
      data-gallery="rail"
      data-ns-hscroll={motion ? "" : undefined}
      className="ns-hscroll scroll-mt-28 py-(--ns-section-y)"
    >
      <div className="ns-hscroll-sticky">
        {head}
        <ul className={`ns-rail flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 ${wrap}`}>
          {images.map((image, i) => (
            <li
              key={`${image.url}-${i}`}
              data-w={i % 3}
              className="ns-rail-item w-[78%] shrink-0 snap-start @3xl:w-[42%]"
            >
              <figure>
                <div
                  data-kind="owner"
                  className="ns-photo ns-rail-photo relative aspect-[4/3] overflow-hidden bg-ns-surface"
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
      </div>
    </section>
  );
}

/**
 * Depoimentos grandes em itálico. No site, com movimento, trocam sozinhos (Motion.tsx) e o botão
 * Pause/Play aparece (WCAG 2.2.2); sem JavaScript ou com "reduzir movimento", ficam um embaixo
 * do outro e o botão continua escondido.
 */
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
      {data.items.length > 1 && (
        // Ligado pelo Motion.tsx só quando a troca automática começa. `data-paused` troca o
        // ícone e o texto (o nome acessível é o texto visível).
        <button
          type="button"
          hidden
          data-ns-quotes-toggle
          className={`group mt-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-ns-border px-5 text-sm text-ns-muted transition-colors hover:border-ns-text hover:text-ns-text motion-reduce:transition-none ${focus}`}
        >
          <PauseIcon className="size-3.5 group-data-paused:hidden" />
          <PlayIcon className="hidden size-3.5 group-data-paused:block" />
          <span className="group-data-paused:hidden">Pause testimonials</span>
          <span className="hidden group-data-paused:inline">Play testimonials</span>
        </button>
      )}
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
  bandTone,
}: {
  id?: string;
  model: SiteModel;
  data: SectionOf<"contact">;
  pool: SiteImage[];
  endpoint?: string;
  bandTone: Tone;
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
      <div
        data-tone={bandTone}
        className="relative isolate grid min-h-[90svh] place-content-center justify-items-center overflow-hidden bg-ns-text px-5 py-28 text-center text-ns-background"
      >
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
            className={`ns-glass ns-glass-inverse relative mt-12 inline-flex min-h-14 items-center gap-3 rounded-full px-9 text-base font-medium text-ns-background ${focus}`}
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
function GiantFooter({ model, bandTone }: { model: SiteModel; bandTone: Tone }) {
  const { business, links, phoneHref } = model;
  const city = location(business);
  const hours = hoursSummary(business.hours);
  const socials = socialLinks(business);
  const year = new Date().getFullYear();
  return (
    <footer data-tone={bandTone} className="overflow-hidden bg-ns-text pt-20 text-ns-background">
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
        {/* Créditos das fotos de banco: uma linha pequena para o site todo (nunca sob cada foto). */}
        <PhotoCredits
          images={specImages(model.spec)}
          className="text-[0.625rem] opacity-80 @3xl:max-w-[50%] @3xl:text-center"
        />
        {/* O crédito da No Sweat é o selo (NoSweatBadge) logo abaixo, desenhado pelo SiteRenderer. */}
        <span className="flex gap-4">
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
