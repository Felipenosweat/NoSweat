import type { SectionOf, SiteImage } from "@nosweat/schema";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  ClockIcon,
  ImageIcon,
  MapPinIcon,
  PhoneIcon,
  UtensilsIcon,
} from "../../components/icons";
import { Photo } from "../../components/photo";
import { externalProps, isOwnerPhoto, locationWithZip } from "../model";
import { BookLink } from "./BookLink";
import type { SoftCtx } from "./context";
import { FoodGlyph } from "./VariantGlyph";
import { featuredServices, shortName, usableHero } from "./soft-data";
import { estimateCta, primaryCta, smsHref, type Cta } from "./variant-data";

// Topo dos quatro ramos que usam a composição "soft" além da beleza. Tudo visível de início,
// nenhuma promessa que o dono não escreveu (horário, área e telefone vêm do SiteSpec).

function servicesOf(ctx: SoftCtx): SectionOf<"services">["items"] {
  const section = ctx.spec.sections.find(
    (item): item is SectionOf<"services"> => item.type === "services",
  );
  return section?.items ?? [];
}

/** Botão em pílula: o principal (`ns-s-btn`, com disco) ou o discreto (`ns-v-quiet`). */
export function ActionPill({
  ctx,
  cta,
  quiet = false,
}: {
  ctx: SoftCtx;
  cta: Cta;
  quiet?: boolean;
}) {
  const className = quiet ? "ns-v-quiet" : "ns-s-btn";
  const label = <span>{cta.label}</span>;
  const disc = quiet ? null : (
    <i aria-hidden="true">{cta.kind === "call" ? <PhoneIcon /> : <ArrowRightIcon />}</i>
  );
  if (cta.kind === "book") {
    return (
      <BookLink fallbackHref={ctx.model.ctaHref} className={className}>
        {label}
        {disc}
      </BookLink>
    );
  }
  return (
    <a href={cta.href} {...externalProps(cta.href)} className={className}>
      {label}
      {disc}
    </a>
  );
}

type FactCell = { key: string; label: string; icon: ReactNode; content: ReactNode };

/** Cartão de fatos logo abaixo do título: só o que o dono escreveu (nada de "aberto agora"). */
export function FactCard({ ctx }: { ctx: SoftCtx }) {
  const { model, variant } = ctx;
  const { business, phoneHref, directionsHref } = model;
  const cells: FactCell[] = [];
  const hours = business.hours?.filter((row) => row.days.trim() && row.time.trim()) ?? [];
  if (hours.length > 0) {
    cells.push({
      key: "hours",
      label: "Hours",
      icon: <ClockIcon />,
      content: (
        <ul>
          {hours.map((row, index) => (
            <li key={`${row.days}-${index}`}>
              <span>{row.days}</span> <span className="ns-v-time">{row.time}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }
  const street = [business.address, locationWithZip(business)].filter(Boolean).join(", ");
  if (variant === "trade" && model.where) {
    cells.push({
      key: "area",
      label: model.areaLabel,
      icon: <MapPinIcon />,
      content: <p>{model.where}</p>,
    });
  }
  if ((variant === "food" || variant === "pro") && (street || model.where)) {
    cells.push({
      key: "find",
      label: variant === "food" ? "Find us" : "Office",
      icon: <MapPinIcon />,
      content: (
        <>
          <p>{street || model.where}</p>
          {directionsHref && (
            <a href={directionsHref} {...externalProps(directionsHref)}>
              Directions<span className="sr-only"> (opens Google Maps)</span>
            </a>
          )}
        </>
      ),
    });
  }
  if (variant === "trade" && phoneHref && business.phone) {
    cells.push({
      key: "phone",
      label: "Phone",
      icon: <PhoneIcon />,
      content: (
        <>
          <a href={phoneHref} className="ns-v-tel">
            {business.phone}
          </a>
          <a href={smsHref(business.phone)}>Text us</a>
        </>
      ),
    });
  }
  if (variant === "food") {
    const cta = primaryCta(ctx);
    const label = business.links?.order ? "Order" : business.links?.booking ? "Reserve" : "Call us";
    cells.push({
      key: "action",
      label,
      icon: cta.kind === "call" ? <PhoneIcon /> : <UtensilsIcon />,
      content: (
        <a href={cta.href} {...externalProps(cta.href)} className="ns-v-tel">
          {cta.kind === "call" ? (business.phone ?? cta.label) : cta.label}
        </a>
      ),
    });
  }
  if (cells.length === 0) return null;
  return (
    <dl className="ns-v-facts ns-s-card" data-count={cells.length}>
      {cells.map((cell) => (
        <div key={cell.key} className="ns-v-fact">
          <dt>
            <span aria-hidden="true">{cell.icon}</span>
            {cell.label}
          </dt>
          <dd>{cell.content}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Fatos que o dono confirmou ("Licensed & insured"): só aparecem se ele escreveu. */
function Highlights({ ctx }: { ctx: SoftCtx }) {
  const items = ctx.model.business.highlights?.filter((item) => item.trim()) ?? [];
  if (items.length === 0) return null;
  return (
    <ul className="ns-v-chips ns-v-chips--hl">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Quadro arredondado da foto: cor do tema por baixo e o ícone, caso a foto demore. */
function PhotoCard({
  image,
  sizes,
  shape,
  priority = true,
}: {
  image: SiteImage;
  sizes: string;
  shape: "wide" | "portrait";
  priority?: boolean;
}) {
  return (
    <div className="ns-v-photo" data-shape={shape}>
      <ImageIcon className="ns-s-ph-icon" />
      <Photo image={image} priority={priority} capToSource sizes={sizes} className="ns-s-img" />
    </div>
  );
}

/** Serviços para casa: a primeira tela vende a ligação (título, Ligar, orçamento e os fatos). */
export function TradeHero({ ctx, data }: { ctx: SoftCtx; data: SectionOf<"hero"> }) {
  const call = primaryCta(ctx);
  const estimate = estimateCta(ctx);
  const photo = usableHero(data.image) ? data.image : undefined;
  return (
    <section className="ns-v-hero" data-v="trade" data-photo={photo ? "yes" : "no"}>
      <div className="ns-v-copy">
        <h1>{data.title}</h1>
        {data.subtitle && <p className="ns-v-sub">{data.subtitle}</p>}
        <div className="ns-v-cta">
          <ActionPill ctx={ctx} cta={call} />
          {estimate && estimate.label !== call.label && (
            <ActionPill ctx={ctx} cta={estimate} quiet />
          )}
          {ctx.hasBooking && (
            <ActionPill
              ctx={ctx}
              cta={{ label: "Schedule a visit", href: "#book", external: false, kind: "book" }}
              quiet
            />
          )}
        </div>
        <FactCard ctx={ctx} />
        <Highlights ctx={ctx} />
      </div>
      {photo && <PhotoCard image={photo} shape="wide" sizes="(min-width: 1024px) 45vw, 100vw" />}
    </section>
  );
}

/** Restaurante: foto de comida em destaque (some no fundo no celular), depois a faixa de fatos. */
export function FoodHero({ ctx, data }: { ctx: SoftCtx; data: SectionOf<"hero"> }) {
  const { model } = ctx;
  const photo = usableHero(data.image) ? data.image : undefined;
  const featured = featuredServices(servicesOf(ctx));
  const media = photo ? "photo" : featured.length > 0 ? "panel" : "none";
  const cta = primaryCta(ctx);
  const menu = model.business.links?.menu;
  const hasMenu = model.links.some((link) => link.anchor === "services");
  return (
    <div>
      <section className="ns-s-hero" data-media={media}>
        {media !== "none" && (
          <div className="ns-s-media">
            <ImageIcon className="ns-s-ph-icon" />
            {photo ? (
              <Photo
                image={photo}
                priority
                capToSource
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="ns-s-img"
              />
            ) : (
              <ul className="ns-s-cluster" aria-hidden="true">
                {featured.map((item, index) => (
                  <li key={`${item.name}-${index}`} className={`ns-s-tone-${index % 4}`}>
                    <FoodGlyph name={item.name} />
                    <span>{shortName(item.name)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="ns-s-body">
          <h1>{data.title}</h1>
          {data.subtitle && <p className="ns-s-sub">{data.subtitle}</p>}
          <div className="ns-s-cta">
            <ActionPill ctx={ctx} cta={cta} />
            {menu ? (
              <a href={menu} {...externalProps(menu)} className="ns-s-call">
                View the menu<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              hasMenu && (
                <a href="#services" className="ns-s-call">
                  View the menu
                </a>
              )
            )}
          </div>
        </div>
      </section>
      <div className="ns-s-sec ns-s-sec--first">
        <div className="ns-s-wrap">
          <FactCard ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

/** Profissional: título tipográfico, botão de consulta, telefone e o retrato do dono (se houver). */
export function ProHero({ ctx, data }: { ctx: SoftCtx; data: SectionOf<"hero"> }) {
  const { model } = ctx;
  const cta = primaryCta(ctx);
  const portrait = isOwnerPhoto(data.image) && usableHero(data.image) ? data.image : undefined;
  const { phoneHref, business } = model;
  return (
    <section className="ns-v-hero" data-v="pro" data-photo={portrait ? "yes" : "no"}>
      <div className="ns-v-copy">
        <h1>{data.title}</h1>
        {data.subtitle && <p className="ns-v-sub">{data.subtitle}</p>}
        <div className="ns-v-cta">
          <ActionPill ctx={ctx} cta={cta} />
          {phoneHref && business.phone && (
            <ActionPill
              ctx={ctx}
              cta={{
                label: `Call ${business.phone}`,
                href: phoneHref,
                external: false,
                kind: "call",
              }}
              quiet
            />
          )}
        </div>
        <FactCard ctx={ctx} />
        <Highlights ctx={ctx} />
      </div>
      {portrait && (
        <PhotoCard image={portrait} shape="portrait" sizes="(min-width: 1024px) 36vw, 100vw" />
      )}
    </section>
  );
}

/** Portfólio: topo mínimo (nome, uma linha, convite); o trabalho vem logo em seguida. */
export function WorkHero({
  ctx,
  data,
  showPhoto,
}: {
  ctx: SoftCtx;
  data: SectionOf<"hero">;
  /** Sem galeria, a foto do topo faz o papel do trabalho. */
  showPhoto: boolean;
}) {
  const { model } = ctx;
  const cta = primaryCta(ctx);
  const photo = showPhoto && usableHero(data.image) ? data.image : undefined;
  const { phoneHref, business } = model;
  return (
    <section className="ns-v-hero" data-v="work" data-photo={photo ? "yes" : "no"}>
      <div className="ns-v-copy">
        <h1>{data.title}</h1>
        {data.subtitle && <p className="ns-v-sub">{data.subtitle}</p>}
        <div className="ns-v-cta">
          <ActionPill ctx={ctx} cta={cta} />
          {phoneHref && business.phone && (
            <ActionPill
              ctx={ctx}
              cta={{
                label: `Call ${business.phone}`,
                href: phoneHref,
                external: false,
                kind: "call",
              }}
              quiet
            />
          )}
        </div>
      </div>
      {photo && <PhotoCard image={photo} shape="wide" sizes="(min-width: 1024px) 50vw, 100vw" />}
    </section>
  );
}
