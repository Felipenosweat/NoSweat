import type { Business } from "@nosweat/schema";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "../../components/icons";
import { Container, initials, telHref } from "../../components/primitives";

export function location(business: Business): string | undefined {
  return [business.city, business.state].filter(Boolean).join(", ") || undefined;
}

/** Área atendida informada pelo dono; sem ela, a cidade/estado do negócio. */
export function areaServed(business: Business): string | undefined {
  return business.serviceArea?.trim() || location(business);
}

export function Logo({ name }: { name: string }) {
  return (
    <a href="#top" className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ns-primary text-sm font-bold text-ns-on-primary">
        {initials(name)}
      </span>
      <span className="line-clamp-2 font-ns-heading text-base leading-tight font-bold tracking-tight [overflow-wrap:anywhere] @min-[40rem]:text-lg">
        {name}
      </span>
    </a>
  );
}

export function TopBar({ business }: { business: Business }) {
  const where = areaServed(business);
  if (!where && !business.email) return null;
  return (
    <div className="bg-ns-text text-sm text-ns-background">
      <Container className="flex h-10 items-center justify-center gap-6 @min-[40rem]:justify-between">
        {where && (
          <p className="flex min-w-0 items-center gap-1.5">
            <MapPinIcon className="size-4 shrink-0" />
            <span className="truncate">Serving {where}</span>
          </p>
        )}
        {business.email && (
          <a
            href={`mailto:${business.email}`}
            className="hidden min-w-0 items-center gap-1.5 hover:underline @min-[40rem]:flex"
          >
            <MailIcon className="size-4 shrink-0" />
            <span className="truncate">{business.email}</span>
          </a>
        )}
      </Container>
    </div>
  );
}

export function Header({
  business,
  links,
}: {
  business: Business;
  links: { anchor: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4 @min-[40rem]:h-20">
        <Logo name={business.name} />
        <nav aria-label="Main" className="hidden items-center gap-8 @3xl:flex">
          {links.map((link) => (
            <a
              key={link.anchor}
              href={`#${link.anchor}`}
              className="text-sm font-medium text-ns-muted transition hover:text-ns-text"
            >
              {link.label}
            </a>
          ))}
        </nav>
        {business.phone && (
          <a
            href={telHref(business.phone)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ns-secondary px-3 py-2.5 font-semibold text-ns-on-secondary shadow-sm transition hover:brightness-105 @min-[40rem]:px-4"
          >
            <PhoneIcon className="size-5" />
            <span className="sr-only whitespace-nowrap @min-[40rem]:not-sr-only">
              {business.phone}
            </span>
          </a>
        )}
      </Container>
    </header>
  );
}

export function CallButton({ phone }: { phone: string }) {
  return (
    <a
      href={telHref(phone)}
      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ns-text/15 bg-ns-background px-6 py-4 text-base font-semibold transition hover:border-ns-primary hover:text-ns-primary"
    >
      <PhoneIcon className="size-5 shrink-0" />
      {/* O número nunca quebra no meio. */}
      <span className="whitespace-nowrap">Call {phone}</span>
    </a>
  );
}

/** Selos com os fatos que o dono confirmou (business.highlights). Sem fatos, nada aparece. */
export function TrustBadges({ highlights }: { highlights?: string[] }) {
  if (!highlights?.length) return null;
  return (
    <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 @min-[40rem]:flex @min-[40rem]:flex-wrap">
      {highlights.map((label, index) => (
        <li key={index} className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ns-primary/10 text-ns-primary">
            <CheckIcon className="size-4" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

export function Hours({ hours }: { hours: NonNullable<Business["hours"]> }) {
  return (
    <dl className="space-y-1 text-sm">
      {hours.map((row, index) => (
        <div key={index} className="flex justify-between gap-6">
          <dt className="text-ns-muted">{row.days}</dt>
          <dd className="text-right font-medium">{row.time}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Card ao lado do título: horário, uma avaliação real (se o dono colocou) e o telefone.
 * Sem nenhuma dessas informações, o card não aparece.
 */
export function HeroCard({
  business,
  quote,
}: {
  business: Business;
  quote?: { quote: string; author: string };
}) {
  const hours = business.hours?.length ? business.hours : null;
  if (!hours && !quote && !business.phone) return null;
  return (
    <div className="rounded-3xl border border-ns-border bg-ns-background p-6 shadow-2xl shadow-ns-text/10 @min-[40rem]:p-8">
      {hours && (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ns-primary">
            <ClockIcon className="size-4" />
            Hours
          </p>
          <div className="mt-4">
            <Hours hours={hours} />
          </div>
        </>
      )}
      {quote && (
        <figure className={`rounded-2xl bg-ns-surface p-5 ${hours ? "mt-6" : ""}`}>
          <blockquote className="text-sm leading-relaxed">&ldquo;{quote.quote}&rdquo;</blockquote>
          <figcaption className="mt-3 text-sm font-semibold text-ns-muted">
            {quote.author}
          </figcaption>
        </figure>
      )}
      {business.phone && (
        <a
          href={telHref(business.phone)}
          className={`flex items-center justify-between gap-3 rounded-2xl bg-ns-primary px-5 py-4 text-ns-on-primary transition hover:brightness-110 ${
            hours || quote ? "mt-6" : ""
          }`}
        >
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wider opacity-80">
              Call us
            </span>
            <span className="block text-xl font-bold whitespace-nowrap">{business.phone}</span>
          </span>
          <ArrowRightIcon className="size-6 shrink-0" />
        </a>
      )}
    </div>
  );
}

export function ContactDetails({ business }: { business: Business }) {
  const where = areaServed(business);
  const rows: { Icon: typeof PhoneIcon; label: string; value: string; href?: string }[] = [];
  if (business.phone) {
    rows.push({
      Icon: PhoneIcon,
      label: "Call us",
      value: business.phone,
      href: telHref(business.phone),
    });
  }
  if (business.email) {
    rows.push({
      Icon: MailIcon,
      label: "Email",
      value: business.email,
      href: `mailto:${business.email}`,
    });
  }
  if (where) rows.push({ Icon: MapPinIcon, label: "Service area", value: where });

  const hours = business.hours?.length ? business.hours : null;
  if (rows.length === 0 && !hours) return null;
  return (
    <ul className="space-y-4">
      {rows.map(({ Icon, label, value, href }) => (
        <li key={label} className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ns-primary/10 text-ns-primary">
            <Icon className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-ns-muted">{label}</span>
            {href ? (
              <a
                href={href}
                className="text-lg font-semibold [overflow-wrap:anywhere] hover:text-ns-primary"
              >
                {value}
              </a>
            ) : (
              <span className="text-lg font-semibold [overflow-wrap:anywhere]">{value}</span>
            )}
          </span>
        </li>
      ))}
      {hours && (
        <li className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ns-primary/10 text-ns-primary">
            <ClockIcon className="size-6" />
          </span>
          <span className="min-w-0 flex-1 pt-1">
            <span className="mb-1 block text-sm text-ns-muted">Hours</span>
            <Hours hours={hours} />
          </span>
        </li>
      )}
    </ul>
  );
}

export function Footer({
  business,
  links,
}: {
  business: Business;
  links: { anchor: string; label: string }[];
}) {
  const where = location(business);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ns-text pb-24 text-ns-background @3xl:pb-0">
      <Container className="grid gap-8 py-12 @min-[40rem]:grid-cols-3">
        <div>
          <p className="font-ns-heading text-lg font-bold [overflow-wrap:anywhere]">
            {business.name}
          </p>
          {where && <p className="mt-2 text-sm opacity-70">{where}</p>}
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <a key={link.anchor} href={`#${link.anchor}`} className="opacity-80 hover:opacity-100">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          {business.phone && (
            <a href={telHref(business.phone)} className="text-lg font-semibold whitespace-nowrap">
              {business.phone}
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="opacity-80 [overflow-wrap:anywhere] hover:opacity-100"
            >
              {business.email}
            </a>
          )}
        </div>
      </Container>
      <div className="border-t border-ns-background/15">
        <Container className="flex flex-col gap-2 py-6 text-xs opacity-70 @min-[40rem]:flex-row @min-[40rem]:justify-between">
          <p className="[overflow-wrap:anywhere]">
            &copy; {year} {business.name}. All rights reserved.
          </p>
          <p>Website by No Sweat</p>
        </Container>
      </div>
    </footer>
  );
}

/** Barra fixa no rodapé do celular: ligar é a ação nº 1 de quem procura prestador de serviço. */
export function MobileCallBar({
  phone,
  ctaLabel,
  ctaHref = "#contact",
}: {
  phone?: string;
  ctaLabel: string;
  ctaHref?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-ns-border bg-ns-background/95 p-3 backdrop-blur @3xl:hidden">
      {phone ? (
        <a
          href={telHref(phone)}
          className="flex items-center justify-center gap-2 rounded-xl bg-ns-secondary py-3 font-semibold text-ns-on-secondary"
        >
          <PhoneIcon className="size-5" />
          Call now
        </a>
      ) : (
        <span />
      )}
      <a
        href={ctaHref}
        className="flex items-center justify-center rounded-xl bg-ns-primary py-3 text-center font-semibold text-ns-on-primary"
      >
        {ctaLabel}
      </a>
    </div>
  );
}
