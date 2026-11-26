import type { SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { ImageIcon } from "../../components/icons";
import { Photo } from "../../components/photo";
import { externalProps, isOwnerPhoto } from "../model";
import { areaPlaces } from "../shared";
import { BookLink } from "./BookLink";
import type { SoftCtx } from "./context";
import { groupServices, usableThumb } from "./soft-data";
import { Band } from "./SoftSections";
import { FoodGlyph, TradeGlyph } from "./VariantGlyph";
import { workShapes } from "./variant-data";

type Item = SectionOf<"services">["items"][number];

/** Botão em pílula da linha ("Call", "Estimate", "Order", "Book", "Inquire"); só com destino real. */
function RowAction({ ctx, item }: { ctx: SoftCtx; item: Item }): ReactNode {
  const { model, variant, hasBooking, hasContact } = ctx;
  const { business, phoneHref } = model;
  const hidden = <span className="sr-only"> {item.name}</span>;
  const className = "ns-v-pill";
  const bookNow = (
    <BookLink service={item.name} fallbackHref={ctx.bookFallbackHref} className={className}>
      Book{hidden}
    </BookLink>
  );
  if (variant === "trade") {
    if (hasBooking) return bookNow;
    if (hasContact) {
      return (
        <a href="#contact" className={className}>
          Estimate{hidden}
        </a>
      );
    }
    return phoneHref ? (
      <a href={phoneHref} className={className}>
        Call{hidden}
      </a>
    ) : null;
  }
  if (variant === "food") {
    const order = business.links?.order;
    return order ? (
      <a href={order} {...externalProps(order)} className={className}>
        Order{hidden}
      </a>
    ) : null;
  }
  if (variant === "pro") {
    if (hasBooking) return bookNow;
    const booking = business.links?.booking;
    if (booking) {
      return (
        <a href={booking} {...externalProps(booking)} className={className}>
          Book{hidden}
        </a>
      );
    }
    return hasContact ? (
      <a href="#contact" className={className}>
        Ask{hidden}
      </a>
    ) : null;
  }
  // Portfólio: o pacote leva ao formulário de pedido.
  return hasContact ? (
    <a href="#contact" className={className}>
      Inquire{hidden}
    </a>
  ) : null;
}

/** Serviços como linhas (casa, profissional, portfólio) ou cartões por grupo (cardápio). */
export function VariantServices({
  ctx,
  data,
  id,
}: {
  ctx: SoftCtx;
  data: SectionOf<"services">;
  id?: string;
}) {
  const { model, variant } = ctx;
  if (data.items.length === 0) return null;
  const groups = groupServices(data.items);
  // Cardápio: um cartão por grupo; os outros ramos, uma lista só.
  const cards = variant === "food" ? groups.map((group) => [group]) : [groups];
  // Número de cada serviço (01, 02...) na ordem da lista.
  const numbering = new Map(data.items.map((item, index) => [item, index + 1] as const));
  return (
    <section id={id} className="ns-s-svc-col">
      <div className="ns-s-sh">
        <h2>{model.titleOf(data)}</h2>
      </div>
      <div className="ns-v-lists">
        {cards.map((card, cardIndex) => (
          <div key={`${card[0]?.name ?? "items"}-${cardIndex}`} className="ns-s-card ns-s-list">
            {card.map((group, groupIndex) => (
              <div key={`${group.name ?? "items"}-${groupIndex}`}>
                {group.name && <h3 className="ns-s-gh">{group.name}</h3>}
                <ul>
                  {group.items.map((item, index) => {
                    const priced = Boolean(item.price?.trim());
                    const thumb =
                      variant === "food" && isOwnerPhoto(item.image) && usableThumb(item.image)
                        ? item.image
                        : undefined;
                    const note = [item.description, item.detail].filter(Boolean).join(" · ");
                    let lead: ReactNode = null;
                    if (thumb) {
                      lead = (
                        <span className="ns-s-rthumb">
                          <ImageIcon className="ns-s-ph-icon" />
                          <Photo image={thumb} capToSource sizes="48px" className="ns-s-img" />
                        </span>
                      );
                    } else if (variant === "trade") {
                      lead = (
                        <span className="ns-v-tile" aria-hidden="true">
                          <TradeGlyph name={item.name} />
                        </span>
                      );
                    } else if (variant === "food") {
                      lead = (
                        <span className="ns-v-tile" aria-hidden="true">
                          <FoodGlyph name={item.name} />
                        </span>
                      );
                    } else if (variant === "pro") {
                      lead = (
                        <span className="ns-v-tile ns-v-tile--num tabular-nums" aria-hidden="true">
                          {String(numbering.get(item) ?? index + 1).padStart(2, "0")}
                        </span>
                      );
                    }
                    return (
                      <li key={`${item.name}-${index}`} className="ns-s-row ns-v-row">
                        {lead}
                        <div className="ns-s-rm">
                          <p className="ns-s-rn">{item.name}</p>
                          {note && <p className="ns-s-rd">{note}</p>}
                        </div>
                        {priced && <span className="ns-s-rp tabular-nums">{item.price}</span>}
                        <RowAction ctx={ctx} item={item} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Há cidades suficientes (duas ou mais, ditas pelo dono) para a nuvem de áreas atendidas. */
export function hasAreaChips(ctx: SoftCtx): boolean {
  return areaPlaces(ctx.model.business.serviceArea).places.length >= 2;
}

/** Áreas atendidas: uma nuvem de pílulas com as cidades que o dono citou. */
export function AreaChips({ ctx, id }: { ctx: SoftCtx; id?: string }) {
  const { places, note } = areaPlaces(ctx.model.business.serviceArea);
  if (places.length < 2) return null;
  return (
    <Band>
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>Areas we serve</h2>
        </div>
        <ul className="ns-v-chips">
          {places.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
        {note && <p className="ns-v-note">...and {note}</p>}
      </section>
    </Band>
  );
}

/** Galeria do portfólio: o trabalho em quadros grandes, legenda embaixo, grade que sempre fecha. */
export function WorkGallery({
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
  const shapes = workShapes(images.length);
  const instagram = ctx.model.business.links?.instagram;
  return (
    <Band className="ns-s-sec--first">
      <section id={id} className="ns-s-anchor">
        <div className="ns-s-sh">
          <h2>{ctx.model.titleOf(data)}</h2>
        </div>
        <ul className="ns-v-work" data-count={images.length}>
          {images.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="ns-v-wk"
              data-m={shapes[index]?.m}
              data-d={shapes[index]?.d}
            >
              <div className="ns-v-wkf">
                <ImageIcon className="ns-s-ph-icon" />
                <Photo
                  image={image}
                  priority={index === 0}
                  capToSource
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="ns-s-img"
                />
              </div>
              {image.caption && <p className="ns-v-wkc">{image.caption}</p>}
            </li>
          ))}
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
