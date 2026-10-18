import type { Business, SectionOf, SiteImage } from "@nosweat/schema";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "../components/icons";
import { Photo, PhotoCredit } from "../components/photo";
import { ContactForm, type ContactFormRadius } from "../sections/ContactForm";
import { externalProps, isOwnerPhoto, location, type SiteModel } from "./model";

// Peças pequenas que as composições combinam de jeitos diferentes. Só utilidades ns-*.

export const focus =
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
 * na frente; as outras põem o botão do texto (ex.: "Book an appointment") na frente.
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
      {...externalProps(ctaHref)}
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
        <span className="whitespace-nowrap tabular-nums">
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

/**
 * Foto com o tratamento do plano (classe ns-photo, ver styles.css) e o crédito do banco.
 * `data-kind` deixa as fotos do dono fora dos filtros (preto e branco, véu de cor).
 */
export function PhotoFrame({
  image,
  className = "",
  imgClassName = "absolute inset-0 size-full object-cover",
  sizes,
  eager = false,
  credit = "overlay",
  radius = "",
}: {
  image: SiteImage;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  eager?: boolean;
  /** "overlay": etiqueta no canto da foto; "below": legenda embaixo; "none": quem chama mostra. */
  credit?: "overlay" | "below" | "none";
  /** Raio da moldura da foto (o mesmo da composição). */
  radius?: string;
}) {
  const hasCredit = Boolean(image.credit) && image.source !== "upload";
  return (
    <figure className={className}>
      <div
        data-kind={image.kind}
        className={`ns-photo relative size-full overflow-hidden bg-ns-border ${radius}`}
      >
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

/** Horário numa linha: "Tue–Sun 11 AM – 9 PM · Sat 9 AM – 2 PM". */
export function hoursSummary(hours: Business["hours"]): string | undefined {
  if (!hours?.length) return undefined;
  return hours.map((row) => `${row.days} ${row.time}`).join(" · ");
}

/** Menor preço dito pelo dono nos serviços ("$45"), para o fato "From". Sem preço, nada. */
export function lowestPrice(model: SiteModel): string | undefined {
  let lowest: number | undefined;
  for (const section of model.spec.sections) {
    if (section.type !== "services") continue;
    for (const item of section.items) {
      const match = item.price ? /\$\s?(\d+(?:\.\d{1,2})?)/.exec(item.price) : null;
      const value = match?.[1] ? Number(match[1]) : Number.NaN;
      if (Number.isFinite(value) && (lowest === undefined || value < lowest)) lowest = value;
    }
  }
  return lowest === undefined ? undefined : `$${lowest}`;
}

/** Um fato como placa: micro-rótulo em caixa alta + o fato. */
export type Fact = { label: string; content: ReactNode };

/**
 * Fatos do negócio para faixas e painéis: horário, onde (endereço com rota, ou a área atendida),
 * telefone e o menor preço. Só o que o dono informou; nada de adjetivos.
 */
export function factsFor(
  model: SiteModel,
  options: { phone?: boolean; price?: boolean; hours?: "table" | "line" } = {},
): Fact[] {
  const { business, where, address, phoneHref, words } = model;
  const facts: Fact[] = [];
  const hours = business.hours?.length ? business.hours : null;
  if (hours) {
    facts.push({
      label: "Hours",
      content:
        options.hours === "line" ? (
          <span className="tabular-nums">{hoursSummary(hours)}</span>
        ) : (
          <HoursTable hours={hours} />
        ),
    });
  }
  if (address && (words.visited || !where)) {
    facts.push({
      label: "Find us",
      content: <AddressBlock model={model} />,
    });
  } else if (where) {
    facts.push({ label: model.areaLabel, content: where });
  }
  if (options.phone !== false && business.phone && phoneHref) {
    facts.push({
      label: "Phone",
      content: (
        <a
          href={phoneHref}
          className={`whitespace-nowrap tabular-nums underline-offset-4 hover:underline ${focus}`}
        >
          {business.phone}
        </a>
      ),
    });
  }
  const price = options.price === false ? undefined : lowestPrice(model);
  if (price) facts.push({ label: "From", content: <span className="tabular-nums">{price}</span> });
  return facts;
}

/** Lista de fatos (dl). As classes deixam cada composição desenhar a sua placa. */
export function FactList({
  facts,
  className = "",
  itemClassName = "",
  labelClassName = "text-xs font-semibold tracking-[0.18em] uppercase",
  valueClassName = "mt-2 font-medium",
}: {
  facts: Fact[];
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  if (facts.length === 0) return null;
  return (
    <dl className={className}>
      {facts.map((fact) => (
        <div key={fact.label} className={itemClassName}>
          <dt className={labelClassName}>{fact.label}</dt>
          <dd className={valueClassName}>{fact.content}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Endereço do dono (rua e cidade) com o link de rota. Sem rua, nada. */
export function AddressBlock({
  model,
  className = "",
  large = false,
}: {
  model: SiteModel;
  className?: string;
  large?: boolean;
}) {
  const { business, directionsHref } = model;
  const street = business.address?.trim();
  if (!street) return null;
  const city = location(business);
  return (
    <address className={`not-italic ${className}`}>
      <span className={`block ${large ? "font-ns-heading text-3xl leading-tight font-bold" : ""}`}>
        {street}
      </span>
      {city && <span className={`block ${large ? "mt-1 text-lg" : ""}`}>{city}</span>}
      {directionsHref && (
        <a
          href={directionsHref}
          {...externalProps(directionsHref)}
          className={`mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-current/40 underline-offset-4 hover:decoration-current ${focus}`}
        >
          <MapPinIcon className="size-4 shrink-0" />
          Directions
          <span className="sr-only"> (opens Google Maps)</span>
        </a>
      )}
    </address>
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

/** Telefone, e-mail, endereço, área e horário em linhas simples (sem ícones grandes). */
export function ContactLines({
  model,
  className = "",
  phone = true,
  place = true,
}: {
  model: SiteModel;
  className?: string;
  /** `false` quando a composição já mostra o telefone grande ao lado. */
  phone?: boolean;
  /** `false` quando a composição já mostra endereço e horário grandes (placa de vitrine). */
  place?: boolean;
}) {
  const { business, phoneHref, where, ctaExternal, ctaHref, ctaLabel } = model;
  const address = place ? model.address : undefined;
  const hours = place && business.hours?.length ? business.hours : null;
  return (
    <dl className={`grid gap-6 ${className}`}>
      {ctaExternal && (
        <div>
          <dt className="text-sm font-medium">Online</dt>
          <dd>
            <a
              href={ctaHref}
              {...externalProps(ctaHref)}
              className={`inline-flex min-h-11 items-center gap-2 text-lg font-semibold underline decoration-current/40 underline-offset-4 hover:decoration-current ${focus}`}
            >
              {ctaLabel}
              <ArrowRightIcon className="size-4 shrink-0" />
            </a>
          </dd>
        </div>
      )}
      {phone && business.phone && phoneHref && (
        <div>
          <dt className="text-sm font-medium">Phone</dt>
          <dd>
            <a
              href={phoneHref}
              className={`text-2xl font-semibold whitespace-nowrap tabular-nums ${focus}`}
            >
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
      {address && (
        <div>
          <dt className="text-sm font-medium">Find us</dt>
          <dd className="mt-1 text-lg font-medium">
            <AddressBlock model={model} />
          </dd>
        </div>
      )}
      {place && where && (!address || business.serviceArea) && (
        <div>
          <dt className="text-sm font-medium">{model.areaLabel}</dt>
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

/** Formulário de contato (o mesmo de todas as composições, com o modelo de campos do ramo). */
export function ContactFormBlock({
  data,
  model,
  endpoint,
  radius = "md",
  framed = true,
  className = "",
}: {
  data: SectionOf<"contact">;
  model: SiteModel;
  endpoint?: string;
  radius?: ContactFormRadius;
  framed?: boolean;
  className?: string;
}) {
  if (!data.showForm) return null;
  return (
    <div className={className}>
      <ContactForm
        endpoint={endpoint}
        submitLabel={model.words.submitLabel}
        preset={model.words.formPreset}
        radius={radius}
        framed={framed}
      />
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
              className={`inline-flex min-h-11 items-center text-sm font-medium whitespace-nowrap transition duration-150 motion-reduce:transition-none ${focus} ${linkClassName}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
  yelp: "Yelp",
  linkedin: "LinkedIn",
  menu: "Full menu",
} as const;

/** Redes e links do dono, em texto (sem ícones de marca). */
export function socialLinks(business: Business): { label: string; href: string }[] {
  const links = business.links;
  if (!links) return [];
  return (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).flatMap((key) => {
    const href = links[key];
    return href ? [{ label: SOCIAL_LABELS[key], href }] : [];
  });
}

/**
 * Rodapé: nome, rua, cidade/estado, telefone, e-mail, horário resumido, área atendida, redes
 * em texto, rota e o crédito da plataforma. Só aparece o que o dono informou.
 */
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
  const { business, phoneHref, links, directionsHref, where } = model;
  const city = location(business);
  const hours = hoursSummary(business.hours);
  const socials = socialLinks(business);
  const year = new Date().getFullYear();
  const linkClass = `inline-flex min-h-11 items-center opacity-80 hover:opacity-100 ${focus}`;
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
        <div className="grid gap-8 text-sm @min-[40rem]:grid-cols-2 @5xl:grid-cols-4">
          <div>
            {!bigName && (
              <p className="font-ns-heading text-lg font-bold [overflow-wrap:anywhere]">
                {business.name}
              </p>
            )}
            {business.category && (
              <p className={bigName ? "font-medium" : "mt-1 opacity-75"}>{business.category}</p>
            )}
            {(business.address || city) && (
              <address className="mt-3 not-italic opacity-80">
                {business.address && <span className="block">{business.address}</span>}
                {city && <span className="block">{city}</span>}
              </address>
            )}
            {directionsHref && (
              <a href={directionsHref} {...externalProps(directionsHref)} className={linkClass}>
                Directions
                <span className="sr-only"> (opens Google Maps)</span>
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {business.phone && phoneHref && (
              <a
                href={phoneHref}
                className={`text-lg font-semibold whitespace-nowrap tabular-nums ${focus}`}
              >
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
            {hours && <p className="opacity-80 tabular-nums">{hours}</p>}
            {where && business.serviceArea && <p className="opacity-80">Serving {where}</p>}
          </div>
          {links.length > 0 && (
            <nav aria-label="Footer" className="-my-3 flex flex-col">
              {links.map((link) => (
                <a key={link.anchor} href={`#${link.anchor}`} className={linkClass}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}
          {socials.length > 0 && (
            <ul aria-label="Elsewhere" className="-my-3 flex flex-col">
              {socials.map((social) => (
                <li key={social.label}>
                  <a href={social.href} {...externalProps(social.href)} className={linkClass}>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
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
      <span className="sr-only whitespace-nowrap tabular-nums @min-[40rem]:not-sr-only">
        {model.business.phone}
      </span>
    </a>
  );
}

/**
 * Ação do cabeçalho, pela ação principal: "call" mostra o telefone (como botão quando `filled`);
 * as outras mostram o botão do topo (ex.: "Book an appointment") e o telefone só como ícone.
 * No celular o botão do texto some: a barra fixa de baixo já faz esse papel.
 */
export function HeaderAction({
  model,
  className = "",
  radius = "rounded-full",
  filled = false,
}: {
  model: SiteModel;
  className?: string;
  radius?: string;
  /** Telefone como botão cheio da cor de ação (serviços para casa). */
  filled?: boolean;
}) {
  const { primaryAction, phoneHref, business, ctaHref, ctaLabel } = model;
  if (primaryAction === "call" && phoneHref && business.phone) {
    return (
      <HeaderCall
        model={model}
        className={
          filled
            ? `${radius} bg-ns-primary px-3 text-ns-on-primary transition hover:brightness-110 motion-reduce:transition-none @min-[40rem]:px-4 ${className}`
            : `text-ns-primary ${className}`
        }
      />
    );
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <HeaderCall model={model} />
      <a
        href={ctaHref}
        {...externalProps(ctaHref)}
        className={`hidden min-h-11 items-center px-4 text-sm font-semibold whitespace-nowrap @3xl:inline-flex ${radius} bg-ns-primary text-ns-on-primary transition hover:brightness-110 motion-reduce:transition-none ${focus}`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}

/** Pessoas do "quem somos": nome, função e uma frase. Foto só se for do dono. */
export function PeopleList({
  people,
  className = "",
  radius = "rounded-md",
}: {
  people: NonNullable<SectionOf<"about">["people"]>;
  className?: string;
  radius?: string;
}) {
  if (people.length === 0) return null;
  return (
    <ul className={`grid gap-8 @min-[40rem]:grid-cols-2 ${className}`}>
      {people.map((person, index) => (
        <li key={`${person.name}-${index}`} className="flex gap-5">
          {isOwnerPhoto(person.image) && (
            <div
              data-kind="owner"
              className={`ns-photo relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-ns-surface ${radius}`}
            >
              <Photo
                image={person.image}
                sizes="96px"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-ns-heading text-xl leading-snug font-bold [overflow-wrap:anywhere]">
              {person.name}
            </h3>
            {person.role && (
              <p className="mt-1 text-xs font-semibold tracking-[0.14em] text-ns-muted uppercase">
                {person.role}
              </p>
            )}
            {person.note && <p className="mt-3 leading-relaxed text-ns-muted">{person.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Foto do "quem somos" (só do dono; banco de imagens nunca passa por "nossa equipe"). */
export function AboutPhoto({
  data,
  className = "",
  radius = "",
}: {
  data: SectionOf<"about">;
  className?: string;
  radius?: string;
}) {
  if (!isOwnerPhoto(data.image)) return null;
  return (
    <PhotoFrame
      image={data.image}
      credit="below"
      radius={radius}
      sizes="(min-width: 1024px) 480px, 100vw"
      className={className}
    />
  );
}

const AREA_NOTE = /^(nearby|surrounding|the surrounding|more|and more|other)\b/i;

/** Lugares da área atendida ("Austin, Round Rock and Buda" → ["Austin", "Round Rock", "Buda"]). */
export function areaPlaces(serviceArea: string | undefined): { places: string[]; note?: string } {
  const parts = (serviceArea ?? "")
    .split(/\s*(?:,|;|\/|\band\b|&)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const note = parts.find((part) => AREA_NOTE.test(part));
  return { places: parts.filter((part) => !AREA_NOTE.test(part)), note };
}

/** Lista grande das cidades atendidas (só quando o dono citou mais de uma). */
export function ServiceAreaList({
  model,
  className = "",
}: {
  model: SiteModel;
  className?: string;
}) {
  const { places, note } = areaPlaces(model.business.serviceArea);
  if (places.length < 2) return null;
  return (
    <div className={className}>
      <p className="text-xs font-semibold tracking-[0.18em] uppercase">Serving</p>
      <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3 font-ns-heading text-2xl leading-tight font-bold @min-[40rem]:text-3xl">
        {places.map((place) => (
          <li key={place}>{place}</li>
        ))}
      </ul>
      {note && <p className="mt-4 opacity-75">and {note.replace(/^and\s+/i, "")}</p>}
    </div>
  );
}

type PriceItem = SectionOf<"services">["items"][number];

/** Itens seguidos do mesmo `group` ficam juntos; sem grupo, um bloco sem título. */
function groupItems(items: PriceItem[]): { name?: string; items: PriceItem[] }[] {
  const groups: { name?: string; items: PriceItem[] }[] = [];
  for (const item of items) {
    const name = item.group?.trim() || undefined;
    const last = groups.at(-1);
    if (last && last.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }
  return groups;
}

/** Os serviços pedem lista de preços (o dono deu preço ou grupos)? */
export function hasPriceList(data: SectionOf<"services">): boolean {
  return data.items.some((item) => Boolean(item.price?.trim() || item.group?.trim()));
}

/**
 * Cardápio de preços: grupos com micro-rótulo, nome … preço com pontilhado, descrição e
 * detalhe (duração, frequência) embaixo. Preços só do dono, em números tabulares.
 */
export function PriceList({
  data,
  className = "",
  columns = true,
}: {
  data: SectionOf<"services">;
  className?: string;
  /** Grupos em duas colunas no computador. */
  columns?: boolean;
}) {
  const groups = groupItems(data.items);
  return (
    <div
      className={`grid gap-x-16 gap-y-12 ${columns && groups.length > 1 ? "@3xl:grid-cols-2" : ""} ${className}`}
    >
      {groups.map((group, groupIndex) => {
        const ItemHeading = group.name ? "h4" : "h3";
        return (
          <div key={`${group.name ?? "items"}-${groupIndex}`}>
            {group.name && (
              <h3 className="border-b border-current/20 pb-3 text-xs font-semibold tracking-[0.18em] uppercase">
                {group.name}
              </h3>
            )}
            <ul>
              {group.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="py-5">
                  <div className="flex items-baseline gap-3">
                    <ItemHeading className="min-w-0 font-ns-heading text-xl leading-snug font-bold [overflow-wrap:anywhere]">
                      {item.name}
                    </ItemHeading>
                    {item.price && (
                      <>
                        <span
                          aria-hidden="true"
                          className="min-w-6 flex-1 border-b border-dotted border-current/40"
                        />
                        <p className="shrink-0 font-semibold whitespace-nowrap tabular-nums">
                          {item.price}
                        </p>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-[56ch] leading-relaxed text-ns-muted">
                    {item.description}
                  </p>
                  {item.detail && (
                    <p className="mt-1.5 text-sm font-medium tabular-nums">{item.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Barra fixa no rodapé do celular. Botão largo = ação principal; quadrado = telefone (ou a rota,
 * ou o e-mail) com nome acessível. Na ação "ligar", o largo liga e o quadrado é a rota/e-mail.
 */
export function MobileCallBar({
  model,
  radius = "rounded-md",
}: {
  model: SiteModel;
  radius?: string;
}) {
  const { business, phoneHref, ctaHref, ctaLabel, primaryAction, directionsHref } = model;
  const callWide = primaryAction === "call" && Boolean(phoneHref && business.phone);
  const email = business.email ? `mailto:${business.email}` : undefined;

  const wide = callWide ? (
    <a
      href={phoneHref}
      className={`flex min-h-12 items-center justify-center gap-2 ${radius} bg-ns-primary px-3 font-semibold text-ns-on-primary ${focus}`}
    >
      <PhoneIcon className="size-5 shrink-0" />
      <span className="whitespace-nowrap tabular-nums">{`Call ${business.phone ?? ""}`}</span>
    </a>
  ) : (
    <a
      href={ctaHref}
      {...externalProps(ctaHref)}
      className={`flex min-h-12 items-center justify-center ${radius} bg-ns-primary px-3 text-center leading-tight font-semibold text-balance text-ns-on-primary ${focus}`}
    >
      {ctaLabel}
    </a>
  );

  let square: ReactNode = null;
  const squareClass = `flex min-h-12 items-center justify-center ${radius} border border-ns-border bg-ns-background text-ns-text ${focus}`;
  if (!callWide && phoneHref && business.phone) {
    square = (
      <a href={phoneHref} aria-label={`Call ${business.phone}`} className={squareClass}>
        <PhoneIcon className="size-5" />
      </a>
    );
  } else if (directionsHref) {
    square = (
      <a
        href={directionsHref}
        {...externalProps(directionsHref)}
        aria-label="Directions (opens Google Maps)"
        className={squareClass}
      >
        <MapPinIcon className="size-5" />
      </a>
    );
  } else if (email) {
    square = (
      <a href={email} aria-label={`Email ${business.email}`} className={squareClass}>
        <MailIcon className="size-5" />
      </a>
    );
  }

  return (
    <nav
      aria-label="Quick contact"
      className={`fixed inset-x-0 bottom-0 z-40 grid gap-2 border-t border-ns-border bg-ns-background/95 p-3 backdrop-blur @3xl:hidden ${
        square ? "grid-cols-[1fr_3rem]" : "grid-cols-1"
      }`}
    >
      {wide}
      {square}
    </nav>
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
