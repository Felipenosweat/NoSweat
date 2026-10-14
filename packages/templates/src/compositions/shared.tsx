import type { Business, SectionOf, SiteImage } from "@nosweat/schema";
import type { ReactNode } from "react";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, PhoneIcon } from "../components/icons";
import { Photo, PhotoCredit } from "../components/photo";
import { ContactForm } from "../sections/ContactForm";
import { location, type SiteModel } from "./model";

// Peças pequenas que as composições combinam de jeitos diferentes. Só utilidades ns-*.

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

/** Onde o botão aparece: fundo do tema, bloco da cor principal ou por cima de foto escurecida. */
export type Surface = "page" | "primary" | "dark";

const PRIMARY_BUTTON: Record<Surface, string> = {
  page: "bg-ns-primary text-ns-on-primary hover:brightness-110",
  primary: "bg-ns-background text-ns-text hover:bg-ns-surface",
  dark: "bg-ns-background text-ns-text hover:bg-ns-surface",
};
const SECONDARY_BUTTON: Record<Surface, string> = {
  page: "border border-ns-text/20 text-ns-text hover:border-ns-text",
  primary: "border border-ns-on-primary/40 text-ns-on-primary hover:border-ns-on-primary",
  dark: "border border-ns-background/50 text-ns-background hover:border-ns-background",
};

const buttonBase = `inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 text-base font-semibold transition duration-150 motion-reduce:transition-none ${focus}`;

/**
 * Botões do topo. A ordem segue a ação principal do plano de design: "call" põe o telefone
 * na frente; as outras põem o botão do texto (ex.: "Book Your Appointment") na frente.
 */
export function HeroActions({
  model,
  surface = "page",
  radius = "rounded-full",
  className = "",
}: {
  model: SiteModel;
  surface?: Surface;
  radius?: string;
  className?: string;
}) {
  const { business, phoneHref, ctaHref, ctaLabel, primaryAction } = model;
  const cta = (primary: boolean) => (
    <a
      key="cta"
      href={ctaHref}
      className={`${buttonBase} ${radius} ${primary ? PRIMARY_BUTTON[surface] : SECONDARY_BUTTON[surface]}`}
    >
      {ctaLabel}
      {primary && <ArrowRightIcon className="size-5 shrink-0" />}
    </a>
  );
  const call = (primary: boolean) =>
    phoneHref && business.phone ? (
      <a
        key="call"
        href={phoneHref}
        className={`${buttonBase} ${radius} ${primary ? PRIMARY_BUTTON[surface] : SECONDARY_BUTTON[surface]}`}
      >
        <PhoneIcon className="size-5 shrink-0" />
        <span className="whitespace-nowrap">
          {primary ? `Call ${business.phone}` : business.phone}
        </span>
      </a>
    ) : null;
  const callFirst = primaryAction === "call" && Boolean(phoneHref);
  return (
    <div
      className={`flex flex-col gap-3 @min-[40rem]:flex-row @min-[40rem]:flex-wrap ${className}`}
    >
      {callFirst ? [call(true), cta(false)] : [cta(true), call(false)]}
    </div>
  );
}

/** Foto com o tratamento do plano (classe ns-photo, ver styles.css) e o crédito do banco. */
export function PhotoFrame({
  image,
  className = "",
  imgClassName = "absolute inset-0 size-full object-cover",
  sizes,
  eager = false,
  credit = "overlay",
}: {
  image: SiteImage;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  eager?: boolean;
  /** "overlay": etiqueta no canto da foto; "below": legenda embaixo; "none": quem chama mostra. */
  credit?: "overlay" | "below" | "none";
}) {
  const hasCredit = Boolean(image.credit) && image.source !== "upload";
  return (
    <figure className={className}>
      <div className="ns-photo relative size-full overflow-hidden bg-ns-border">
        <Photo
          image={image}
          loading={eager ? "eager" : "lazy"}
          sizes={sizes}
          className={imgClassName}
        />
        {hasCredit && credit === "overlay" && (
          <figcaption className="absolute right-3 bottom-3 z-10 max-w-[calc(100%-1.5rem)] rounded-md bg-ns-background/90 px-2 py-1 text-[0.6875rem] leading-tight text-ns-text">
            <PhotoCredit image={image} />
          </figcaption>
        )}
      </div>
      {hasCredit && credit === "below" && (
        <figcaption className="mt-3 text-xs text-ns-muted">
          <PhotoCredit image={image} />
        </figcaption>
      )}
    </figure>
  );
}

/** Fatos confirmados pelo dono (business.highlights) em linha. Sem fatos, nada. */
export function HighlightList({
  highlights,
  className = "",
}: {
  highlights?: string[];
  className?: string;
}) {
  if (!highlights?.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium ${className}`}>
      {highlights.map((label, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckIcon className="size-4 shrink-0 opacity-70" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function HoursTable({
  hours,
  className = "",
}: {
  hours: NonNullable<Business["hours"]>;
  className?: string;
}) {
  return (
    <dl className={`space-y-1.5 ${className}`}>
      {hours.map((row, index) => (
        <div key={index} className="flex justify-between gap-6">
          <dt>{row.days}</dt>
          <dd className="text-right font-medium tabular-nums">{row.time}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Perguntas em <details> (sem JavaScript). `tone` muda só as linhas e o ícone. */
export function FaqList({ data, className = "" }: { data: SectionOf<"faq">; className?: string }) {
  return (
    <div className={`divide-y divide-current/15 border-y border-current/15 ${className}`}>
      {data.items.map((item, index) => (
        <details key={`${item.q}-${index}`} className="group" open={index === 0}>
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-semibold [&::-webkit-details-marker]:hidden ${focus}`}
          >
            {item.q}
            <ChevronDownIcon className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className="max-w-[65ch] pb-6 leading-relaxed opacity-80">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Telefone, e-mail, área e horário em linhas simples (sem ícones grandes). */
export function ContactLines({ model, className = "" }: { model: SiteModel; className?: string }) {
  const { business, phoneHref, where } = model;
  const hours = business.hours?.length ? business.hours : null;
  return (
    <dl className={`grid gap-6 ${className}`}>
      {business.phone && phoneHref && (
        <div>
          <dt className="text-sm font-medium">Phone</dt>
          <dd>
            <a href={phoneHref} className={`text-2xl font-semibold whitespace-nowrap ${focus}`}>
              {business.phone}
            </a>
          </dd>
        </div>
      )}
      {business.email && (
        <div>
          <dt className="text-sm font-medium">Email</dt>
          <dd>
            <a
              href={`mailto:${business.email}`}
              className={`text-lg font-medium [overflow-wrap:anywhere] underline-offset-4 hover:underline ${focus}`}
            >
              {business.email}
            </a>
          </dd>
        </div>
      )}
      {where && (
        <div>
          <dt className="text-sm font-medium">
            {business.serviceArea ? "Service area" : "Location"}
          </dt>
          <dd className="text-lg font-medium">{where}</dd>
        </div>
      )}
      {hours && (
        <div>
          <dt className="text-sm font-medium">Hours</dt>
          <dd className="mt-1">
            <HoursTable hours={hours} />
          </dd>
        </div>
      )}
    </dl>
  );
}

/** Formulário de contato (o mesmo de todas as composições). */
export function ContactFormBlock({
  data,
  endpoint,
  className = "",
}: {
  data: SectionOf<"contact">;
  endpoint?: string;
  className?: string;
}) {
  if (!data.showForm) return null;
  return (
    <div className={className}>
      <ContactForm endpoint={endpoint} submitLabel="Send request" />
    </div>
  );
}

/** Menu de âncoras para o cabeçalho (some no celular: lá a barra fixa faz o trabalho). */
export function NavLinks({
  model,
  className = "",
  linkClassName = "",
}: {
  model: SiteModel;
  className?: string;
  linkClassName?: string;
}) {
  if (model.links.length === 0) return null;
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-7">
        {model.links.map((link) => (
          <li key={link.anchor}>
            <a
              href={`#${link.anchor}`}
              className={`inline-flex min-h-11 items-center text-sm font-medium transition duration-150 motion-reduce:transition-none ${focus} ${linkClassName}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Rodapé enxuto: nome, cidade, contato, menu e o crédito da plataforma. */
export function SimpleFooter({
  model,
  className = "",
  bigName = false,
  wide = false,
  children,
}: {
  model: SiteModel;
  className?: string;
  /** Mesma largura das composições largas (max-w-7xl). */
  wide?: boolean;
  /** Nome do negócio enorme no rodapé (composições tipográficas/editoriais). */
  bigName?: boolean;
  children?: ReactNode;
}) {
  const { business, phoneHref, links } = model;
  const where = location(business);
  const year = new Date().getFullYear();
  return (
    <footer className={`pb-24 @3xl:pb-0 ${className}`}>
      <div
        className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 py-14 @min-[40rem]:px-6 @5xl:px-8`}
      >
        {bigName && (
          <p className="mb-12 font-ns-heading text-[length:clamp(2.5rem,9cqw,7rem)] leading-[0.95] font-bold tracking-tight [overflow-wrap:anywhere]">
            {business.name}
          </p>
        )}
        <div className="grid gap-8 text-sm @min-[40rem]:grid-cols-3">
          <div>
            {!bigName && (
              <p className="font-ns-heading text-lg font-bold [overflow-wrap:anywhere]">
                {business.name}
              </p>
            )}
            {where && <p className={bigName ? "" : "mt-2 opacity-75"}>{where}</p>}
          </div>
          {links.length > 0 && (
            <nav aria-label="Footer" className="-my-3 flex flex-col">
              {links.map((link) => (
                <a
                  key={link.anchor}
                  href={`#${link.anchor}`}
                  className={`inline-flex min-h-11 items-center opacity-80 hover:opacity-100 ${focus}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
          <div className="flex flex-col gap-2">
            {business.phone && phoneHref && (
              <a href={phoneHref} className={`text-lg font-semibold whitespace-nowrap ${focus}`}>
                {business.phone}
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className={`opacity-80 [overflow-wrap:anywhere] hover:opacity-100 ${focus}`}
              >
                {business.email}
              </a>
            )}
          </div>
        </div>
        {children}
        <div className="mt-12 flex flex-col gap-2 border-t border-current/15 pt-6 text-xs opacity-70 @min-[40rem]:flex-row @min-[40rem]:justify-between">
          <p className="[overflow-wrap:anywhere]">
            &copy; {year} {business.name}. All rights reserved.
          </p>
          <p>Website by No Sweat</p>
        </div>
      </div>
    </footer>
  );
}

/** Link de telefone compacto para cabeçalhos. */
export function HeaderCall({ model, className = "" }: { model: SiteModel; className?: string }) {
  if (!model.phoneHref || !model.business.phone) return null;
  return (
    <a
      href={model.phoneHref}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 font-semibold ${focus} ${className}`}
    >
      <PhoneIcon className="size-5 shrink-0" />
      <span className="sr-only whitespace-nowrap @min-[40rem]:not-sr-only">
        {model.business.phone}
      </span>
    </a>
  );
}

/** Container padrão das composições (mesma largura das outras seções). */
export function Wrap({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 @min-[40rem]:px-6 @5xl:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

/** Espaço vertical das seções, que segue a densidade do plano (variável em styles.css). */
export const sectionY = "py-(--ns-section-y)";
