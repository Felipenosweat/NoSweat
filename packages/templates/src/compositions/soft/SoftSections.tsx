import { paymentPills, type PaymentSettings, type SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import {
  CalendarIcon,
  ImageIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
  PlusIcon,
} from "../../components/icons";
import { Photo, PhotoCredits, specImages } from "../../components/photo";
import { VISITOR_PRIVACY_URL } from "../../sections/ContactForm";
import { externalProps, isOwnerPhoto, locationWithZip } from "../model";
import { ReviewUsLink } from "../ReviewLink";
import { ContactFormBlock, hoursSummary, socialLinks } from "../shared";
import { BookLink } from "./BookLink";
import type { SoftCtx } from "./context";
import { ServiceGlyph } from "./ServiceGlyph";
import { galleryShapes, groupServices, initials, usableThumb } from "./soft-data";
import { smsHref } from "./variant-data";

/** Faixa da página: espaço vertical e largura máxima. */
export function Band({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ns-s-sec ${className}`}>
      <div className="ns-s-wrap">{children}</div>
    </div>
  );
}

/** Serviços como no app: cabeçalho do salão, abas e linhas com nome, duração, preço e o "+". */
export function SoftServices({
  ctx,
  data,
  id,
}: {
  ctx: SoftCtx;
  data: SectionOf<"services">;
  id?: string;
}) {
  const { model } = ctx;
  const { business, links } = model;
  if (data.items.length === 0) return null;
  const groups = groupServices(data.items);
  const tabs = [
    { label: "Services", href: "#services", current: true },
    ...(links.some((link) => link.anchor === "about")
      ? [{ label: "About", href: "#about", current: false }]
      : []),
    ...(links.some((link) => link.anchor === "reviews")
      ? [{ label: "Reviews", href: "#reviews", current: false }]
      : []),
  ];
  const askHref = ctx.hasContact ? "#contact" : (model.phoneHref ?? model.ctaHref);
  const fallback = ctx.bookFallbackHref;
  const fallbackIsCall = fallback.startsWith("tel:");
  const subtitle = [business.category, model.where].filter(Boolean).join(" · ");
  return (
    <section id={id} className="ns-s-svc-col">
      <h2 className="sr-only">{model.titleOf(data)}</h2>
      <div className="ns-s-salon">
        <span className="ns-s-logo" aria-hidden="true">
          <ServiceGlyph name={data.items[0]?.name ?? ""} />
        </span>
        <div>
          <b>{business.name}</b>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>
      <div className="ns-s-card ns-s-listcard">
        {tabs.length > 1 && (
          <nav aria-label="Sections" className="ns-s-tabs">
            {tabs.map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                aria-current={tab.current ? "true" : undefined}
                className={tab.current ? "is-on" : undefined}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        )}
        <div className="ns-s-list">
          {groups.map((group, groupIndex) => (
            <div key={`${group.name ?? "items"}-${groupIndex}`}>
              {group.name && <h3 className="ns-s-gh">{group.name}</h3>}
              <ul>
                {group.items.map((item, index) => {
                  const priced = Boolean(item.price?.trim());
                  const thumb =
                    isOwnerPhoto(item.image) && usableThumb(item.image) ? item.image : undefined;
                  return (
                    <li key={`${item.name}-${index}`} className="ns-s-row">
                      {thumb && (
                        <span className="ns-s-rthumb">
                          <ImageIcon className="ns-s-ph-icon" />
                          <Photo image={thumb} capToSource sizes="48px" className="ns-s-img" />
                        </span>
                      )}
                      <div className="ns-s-rm">
                        <p className="ns-s-rn">{item.name}</p>
                        {(item.detail ?? item.description) && (
                          <p className="ns-s-rd">{item.detail ?? item.description}</p>
                        )}
                      </div>
                      {priced && <span className="ns-s-rp tabular-nums">{item.price}</span>}
                      {!priced ? (
                        <a href={askHref} className="ns-s-plus ns-s-plus--ask">
                          Ask<span className="sr-only"> about {item.name}</span>
                        </a>
                      ) : ctx.hasBooking ? (
                        <BookLink
                          service={item.name}
                          fallbackHref={fallback}
                          ariaLabel={`Book ${item.name}`}
                          className="ns-s-plus"
                        >
                          <PlusIcon />
                        </BookLink>
                      ) : (
                        <a
                          href={fallback}
                          {...externalProps(fallback)}
                          aria-label={`${fallbackIsCall ? "Call to book" : "Book"} ${item.name}`}
                          className="ns-s-plus"
                        >
                          <PlusIcon />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Quem somos: texto num cartão suave e uma linha por pessoa (iniciais se não há foto do dono). */
export function SoftAbout({
  ctx,
  data,
  id,
}: {
  ctx: SoftCtx;
  data: SectionOf<"about">;
  id?: string;
}) {
  const people = (data.people ?? []).filter((person) => person.name.trim());
  const photo = isOwnerPhoto(data.image) && usableThumb(data.image) ? data.image : undefined;
  return (
    <Band>
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>{ctx.model.titleOf(data)}</h2>
        </div>
        <div className="ns-s-about">
          <div>
            {photo && (
              <div className="ns-s-aphoto">
                <ImageIcon className="ns-s-ph-icon" />
                <Photo
                  image={photo}
                  capToSource
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="ns-s-img"
                />
              </div>
            )}
            {data.body.trim() && <div className="ns-s-abt">{data.body}</div>}
          </div>
          {people.length > 0 && (
            <ul className="ns-s-ppl">
              {people.map((person, index) => {
                const avatar =
                  isOwnerPhoto(person.image) && usableThumb(person.image)
                    ? person.image
                    : undefined;
                return (
                  <li key={`${person.name}-${index}`} className="ns-s-card ns-s-pc">
                    <span className="ns-s-av">
                      {avatar ? (
                        <Photo image={avatar} capToSource sizes="56px" className="ns-s-img" />
                      ) : (
                        <span aria-hidden="true">{initials(person.name)}</span>
                      )}
                    </span>
                    <div>
                      <b>{person.name}</b>
                      {person.role && <em>{person.role}</em>}
                      {person.note && <span>{person.note}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </Band>
  );
}

/** Galeria só com fotos do dono, em grade que sempre fecha (sem quadro vazio). */
export function SoftGallery({
  ctx,
  data,
  id,
}: {
  ctx: SoftCtx;
  data: SectionOf<"gallery">;
  id?: string;
}) {
  const images = data.images
    .filter((image) => isOwnerPhoto(image))
    .filter((image) => usableThumb(image));
  if (images.length === 0) return null;
  const shapes = galleryShapes(images.length);
  const instagram = ctx.model.business.links?.instagram;
  return (
    <Band>
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>{ctx.model.titleOf(data)}</h2>
        </div>
        <ul className="ns-s-gal" data-count={images.length}>
          {images.map((image, index) => {
            const shape = shapes[index];
            return (
              <li
                key={`${image.url}-${index}`}
                className="ns-s-tile"
                data-m={shape?.m}
                data-d={shape?.d}
              >
                <ImageIcon className="ns-s-ph-icon" />
                <Photo
                  image={image}
                  capToSource
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="ns-s-img"
                />
                {image.caption && <span className="ns-s-cap">{image.caption}</span>}
              </li>
            );
          })}
        </ul>
        {instagram && (
          <a href={instagram} {...externalProps(instagram)} className="ns-s-quiet">
            More on Instagram
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </section>
    </Band>
  );
}

/** Avaliações escritas pelo dono (sem estrelas nem números): fileira de cartões que desliza. */
export function SoftTestimonials({
  ctx,
  data,
  id,
}: {
  ctx: SoftCtx;
  data: SectionOf<"testimonials">;
  id?: string;
}) {
  const items = data.items.filter((item) => item.quote.trim());
  if (items.length === 0) return null;
  const title = ctx.model.titleOf(data);
  return (
    <Band>
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>{title}</h2>
        </div>
        <ul className="ns-s-quotes" data-count={items.length} tabIndex={0} aria-label={title}>
          {items.map((item, index) => (
            <li key={`${item.author}-${index}`} className="ns-s-card ns-s-quote">
              <blockquote>{item.quote}</blockquote>
              <p>{item.author}</p>
            </li>
          ))}
        </ul>
      </section>
    </Band>
  );
}

/** Perguntas em <details>, a primeira aberta (o conteúdo nunca fica escondido de início). */
export function SoftFaq({ ctx, data, id }: { ctx: SoftCtx; data: SectionOf<"faq">; id?: string }) {
  if (data.items.length === 0) return null;
  return (
    <Band>
      <section id={id} className="ns-s-anchor ns-s-faq">
        <div className="ns-s-sh">
          <h2>{ctx.model.titleOf(data)}</h2>
        </div>
        <div>
          {data.items.map((item, index) => (
            <details key={`${item.q}-${index}`} className="ns-s-qa" open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Band>
  );
}

/** "Payment": o que o dono aceita (só informativo; nada quando ele não escolheu). */
export function SoftPayments({ payments }: { payments: PaymentSettings | undefined }) {
  const pills = paymentPills(payments);
  if (pills.length === 0) return null;
  const note = payments?.note?.trim();
  return (
    <div className="ns-s-card ns-s-pay">
      <h3>Payment</h3>
      <ul className="ns-s-paylist">
        {pills.map((pill) => (
          <li key={pill}>{pill}</li>
        ))}
      </ul>
      {note && <p className="ns-s-paynote">{note}</p>}
    </div>
  );
}

/** Contato: ações em pílula (agendar, ligar, rota), horário e o formulário. */
export function SoftContact({
  ctx,
  data,
  id,
  endpoint,
}: {
  ctx: SoftCtx;
  data: SectionOf<"contact">;
  id?: string;
  endpoint?: string;
}) {
  const { model } = ctx;
  const { business, phoneHref, directionsHref, address } = model;
  const hours = business.hours?.length ? business.hours : null;
  const external = business.links?.booking;
  const bookClass = "ns-s-act ns-s-act--primary";
  const bookInner = (
    <>
      <span className="ns-s-tl-sm" aria-hidden="true">
        <CalendarIcon />
      </span>
      {model.ctaLabel}
    </>
  );
  return (
    <Band>
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>{model.titleOf(data)}</h2>
        </div>
        <div className="ns-s-contact" data-form={data.showForm ? "yes" : "no"}>
          <div className="ns-s-contact-info">
            <div className="ns-s-card ns-s-acts">
              {ctx.hasBooking ? (
                <BookLink fallbackHref={model.ctaHref} className={bookClass}>
                  {bookInner}
                </BookLink>
              ) : external ? (
                <a href={external} {...externalProps(external)} className={bookClass}>
                  {bookInner}
                </a>
              ) : null}
              {phoneHref && business.phone && (
                <a href={phoneHref} className="ns-s-act">
                  <span className="ns-s-tl-sm" aria-hidden="true">
                    <PhoneIcon />
                  </span>
                  Call {business.phone}
                </a>
              )}
              {ctx.variant === "trade" && phoneHref && business.phone && (
                <a href={smsHref(business.phone)} className="ns-s-act">
                  <span className="ns-s-tl-sm" aria-hidden="true">
                    <MessageIcon />
                  </span>
                  Text us
                </a>
              )}
              {directionsHref && (
                <a href={directionsHref} {...externalProps(directionsHref)} className="ns-s-act">
                  <span className="ns-s-tl-sm" aria-hidden="true">
                    <MapPinIcon />
                  </span>
                  <span>
                    Directions
                    <small>{[address, locationWithZip(business)].filter(Boolean).join(", ")}</small>
                    <span className="sr-only"> (opens Google Maps)</span>
                  </span>
                </a>
              )}
              {!directionsHref && model.where && (
                <p className="ns-s-where">
                  {model.areaLabel} {model.where}
                </p>
              )}
            </div>
            {hours && (
              <div className="ns-s-card ns-s-hours">
                <h3>Hours</h3>
                <dl>
                  {hours.map((row, index) => (
                    <div key={`${row.days}-${index}`}>
                      <dt>{row.days}</dt>
                      <dd>{row.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <SoftPayments payments={business.payments} />
            <ReviewUsLink business={business} className="ns-s-review" />
          </div>
          {data.showForm && (
            <div className="ns-s-card ns-s-formcard">
              <h3>Prefer to write to us?</h3>
              <ContactFormBlock
                data={data}
                model={model}
                endpoint={endpoint}
                radius="soft"
                framed={false}
              />
            </div>
          )}
        </div>
      </section>
    </Band>
  );
}

/** Rodapé arredondado: endereço, horário, telefone, redes, créditos das fotos e a política. */
export function SoftFooter({ ctx }: { ctx: SoftCtx }) {
  const { model, spec } = ctx;
  const { business, phoneHref } = model;
  const city = locationWithZip(business);
  const hours = hoursSummary(business.hours);
  const socials = socialLinks(business);
  const payPills = paymentPills(business.payments);
  return (
    <footer className="ns-s-footer">
      <div className="ns-s-wrap">
        <b>{business.name}</b>
        {(business.address || city) && <p>{[business.address, city].filter(Boolean).join(", ")}</p>}
        {hours && <p>{hours}</p>}
        {(phoneHref || business.email) && (
          <p>
            {phoneHref && business.phone && <a href={phoneHref}>{business.phone}</a>}
            {phoneHref && business.phone && business.email && " · "}
            {business.email && <a href={`mailto:${business.email}`}>{business.email}</a>}
          </p>
        )}
        {socials.length > 0 && (
          <ul className="ns-s-social">
            {socials.map((social) => (
              <li key={social.label}>
                <a href={social.href} {...externalProps(social.href)}>
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {!ctx.hasContact && payPills.length > 0 && (
          <p className="ns-s-payline">{`Payment: ${payPills.join(" · ")}`}</p>
        )}
        <ReviewUsLink business={business} className="ns-s-review" />
        <div className="ns-s-fine">
          <span>
            &copy; {new Date().getFullYear()} {business.name}
          </span>
          <PhotoCredits images={specImages(spec)} />
          <a href={VISITOR_PRIVACY_URL} target="_blank" rel="noopener">
            Privacy<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
