import type { SectionOf, SiteImage } from "@nosweat/schema";
import { ArrowRightIcon, ImageIcon, PhoneIcon } from "../../components/icons";
import { Photo } from "../../components/photo";
import { externalProps, isOwnerPhoto } from "../model";
import { BookLink } from "./BookLink";
import type { SoftCtx } from "./context";
import { NextOpening } from "./NextOpening";
import { ServiceGlyph } from "./ServiceGlyph";
import { SoftMenu } from "./SoftMenu";
import { featuredServices, shortName, usableHero, usableThumb } from "./soft-data";

function servicesOf(ctx: SoftCtx): SectionOf<"services">["items"] {
  const section = ctx.spec.sections.find(
    (item): item is SectionOf<"services"> => item.type === "services",
  );
  return section?.items ?? [];
}

/** Botão principal: abre o agendamento do site; sem ele, o link do dono ou o contato. */
function MainAction({ ctx, className }: { ctx: SoftCtx; className: string }) {
  const { model, hasBooking } = ctx;
  const label = <span>{model.ctaLabel}</span>;
  if (hasBooking) {
    return (
      <BookLink fallbackHref={model.ctaHref} className={className}>
        {label}
        <i aria-hidden="true">
          <ArrowRightIcon />
        </i>
      </BookLink>
    );
  }
  return (
    <a href={model.ctaHref} {...externalProps(model.ctaHref)} className={className}>
      {label}
      <i aria-hidden="true">
        <ArrowRightIcon />
      </i>
    </a>
  );
}

/** Cabeçalho: pílula com o nome, e no celular os botões redondos de ligar e do menu. */
export function SoftHeader({ ctx }: { ctx: SoftCtx }) {
  const { model } = ctx;
  const { business, links, phoneHref } = model;
  return (
    <header className="ns-s-header">
      <a href="#top" className="ns-s-pill">
        {business.name}
      </a>
      {links.length > 0 && (
        <nav aria-label="Main" className="ns-s-nav">
          <ul>
            {links.map((link) => (
              <li key={link.anchor}>
                <a href={`#${link.anchor}`}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="ns-s-hright">
        {phoneHref && business.phone && (
          <a
            href={phoneHref}
            className="ns-s-circ ns-s-circ--call"
            aria-label={`Call ${business.phone}`}
          >
            <PhoneIcon />
          </a>
        )}
        <SoftMenu
          links={links}
          ctaHref={ctx.hasBooking ? "#book" : model.ctaHref}
          ctaLabel={model.ctaLabel}
          ctaExternal={!ctx.hasBooking && model.ctaExternal}
        />
        <a
          href={ctx.hasBooking ? "#book" : model.ctaHref}
          {...(ctx.hasBooking ? {} : externalProps(model.ctaHref))}
          className="ns-s-btn ns-s-btn--sm ns-s-hcta"
        >
          {model.ctaLabel}
        </a>
      </div>
    </header>
  );
}

/** Topo: a tela de boas-vindas do app (foto que some no fundo, título, botão em pílula). */
export function SoftHero({ ctx, data }: { ctx: SoftCtx; data: SectionOf<"hero"> }) {
  const { model } = ctx;
  const photo = usableHero(data.image) ? data.image : undefined;
  const featured = featuredServices(servicesOf(ctx));
  const media = photo ? "photo" : featured.length > 0 ? "panel" : "none";
  const showNext = ctx.hasBooking && Boolean(ctx.bookingEndpoint || ctx.demo);
  return (
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
                  <ServiceGlyph name={item.name} />
                  <span>{shortName(item.name)}</span>
                </li>
              ))}
            </ul>
          )}
          {showNext && <NextOpening endpoint={ctx.bookingEndpoint} demo={ctx.demo} />}
        </div>
      )}
      <div className="ns-s-body">
        <h1>{data.title}</h1>
        {data.subtitle && <p className="ns-s-sub">{data.subtitle}</p>}
        <div className="ns-s-cta">
          <MainAction ctx={ctx} className="ns-s-btn" />
          {model.phoneHref && model.business.phone && (
            <a href={model.phoneHref} className="ns-s-call">
              Call {model.business.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/** Faixa de convite (a "home" do app): só texto de função, nenhuma promessa. */
export function SoftBanner({ ctx }: { ctx: SoftCtx }) {
  const { spec, model } = ctx;
  const online = ctx.hasBooking || Boolean(model.business.links?.booking);
  if (!online || servicesOf(ctx).length === 0) return null;
  // Foto da faixa: uma foto do dono da galeria; sem ela, a do topo; sem nenhuma, uma forma do tema.
  let photo: SiteImage | undefined;
  for (const section of spec.sections) {
    if (section.type === "gallery") {
      photo = section.images
        .filter((image) => isOwnerPhoto(image))
        .find((image) => usableThumb(image));
    }
    if (photo) break;
  }
  if (!photo) {
    const hero = spec.sections.find(
      (section): section is SectionOf<"hero"> => section.type === "hero",
    );
    if (usableHero(hero?.image)) photo = hero?.image;
  }
  return (
    <div className="ns-s-sec ns-s-sec--first">
      <div className="ns-s-wrap">
        <div className="ns-s-banner">
          <div className="ns-s-banner-text">
            <h2>Book your next visit</h2>
            <p>Pick a service, a day and a time that works for you.</p>
            <a href="#services" className="ns-s-banner-btn">
              Explore services
            </a>
          </div>
          <div className="ns-s-banner-art" aria-hidden="true">
            {photo && (
              <Photo
                image={photo}
                alt=""
                capToSource
                sizes="(min-width: 1024px) 40vw, 60vw"
                className="ns-s-img"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Quatro azulejos pastel com ícone de linha: um por grupo de serviço (depois completa). */
export function SoftPopular({ ctx }: { ctx: SoftCtx }) {
  const featured = featuredServices(servicesOf(ctx));
  if (featured.length === 0) return null;
  return (
    <div className="ns-s-sec">
      <div className="ns-s-wrap">
        <div className="ns-s-sh">
          <h2>Popular services</h2>
          <a href="#services">See all</a>
        </div>
        <ul className="ns-s-pop">
          {featured.map((item, index) => {
            const tile = (
              <>
                <span className={`ns-s-tl ns-s-tone-${index % 4}`}>
                  <ServiceGlyph name={item.name} />
                </span>
                <b>{shortName(item.name)}</b>
                {(item.detail ?? item.group) && <small>{item.detail ?? item.group}</small>}
              </>
            );
            return (
              <li key={`${item.name}-${index}`}>
                {ctx.hasBooking ? (
                  <BookLink service={item.name} fallbackHref="#services" className="ns-s-pt">
                    {tile}
                  </BookLink>
                ) : (
                  <a href="#services" className="ns-s-pt">
                    {tile}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
