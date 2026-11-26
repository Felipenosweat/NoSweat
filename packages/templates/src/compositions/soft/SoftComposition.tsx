import type { Section } from "@nosweat/schema";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { BookingSection } from "../../sections/BookingSection";
import type { TemplateProps } from "../../types";
import { buildModel, renderSections } from "../model";
import {
  Band,
  SoftAbout,
  SoftContact,
  SoftFaq,
  SoftFooter,
  SoftGallery,
  SoftServices,
  SoftTestimonials,
} from "./SoftSections";
import type { SoftCtx } from "./context";
import { SoftDock, type DockSlot } from "./SoftDock";
import { SoftBanner, SoftHeader, SoftHero, SoftPopular } from "./SoftHero";
import { demoServicesFrom, usableThumb } from "./soft-data";
import { FoodHero, ProHero, TradeHero, WorkHero } from "./VariantHero";
import { AreaChips, VariantServices, WorkGallery, hasAreaChips } from "./VariantSections";
import { variantSlots } from "./variant-dock";
import { VARIANT_OF, actionColors, primaryCta } from "./variant-data";

// Composição "soft": o site com a cara de um app. Beleza é a base (app de salão); serviços para
// casa, restaurante, profissional e portfólio são variantes (`data-variant`) com topo, linhas,
// cores de ação e barra próprios. Tudo visível de início (sem revelar ao rolar), sem paralaxe e sem
// zoom nas fotos. Os estilos moram em styles.css sob `.ns-soft`. O molde Signature continua no
// repositório como plano B (ver SOFT_TEMPLATES em SiteRenderer.tsx).

type VariantStyle = CSSProperties & Record<`--v-${string}`, string>;

export function SoftComposition({
  spec,
  contactEndpoint,
  bookingEndpoint,
  bookingDemo = false,
  editable = false,
  selectedSection = null,
  anchors = true,
}: TemplateProps) {
  const model = buildModel(spec, anchors);
  const variant = VARIANT_OF[spec.template];
  const { business, phoneHref } = model;
  const hasBooking = spec.sections.some((section) => section.type === "booking");
  const hasContact = spec.sections.some((section) => section.type === "contact");
  const external = business.links?.booking;
  const ctx: SoftCtx = {
    model,
    spec,
    variant,
    hasBooking,
    bookingEndpoint,
    demo: bookingDemo
      ? { services: demoServicesFrom(spec), businessName: business.name }
      : undefined,
    hasContact,
    bookFallbackHref: external ?? phoneHref ?? (hasContact ? "#contact" : model.ctaHref),
  };

  // Portfólio: a primeira galeria com fotos de verdade sobe para logo depois do topo.
  const firstGallery = spec.sections.find(
    (section): section is Extract<Section, { type: "gallery" }> => section.type === "gallery",
  );
  const hoisted =
    variant === "work" && !editable && spec.sections.some((section) => section.type === "hero")
      ? firstGallery
      : undefined;
  const hasWorkImages = Boolean(
    firstGallery?.images.some((image) => image.kind === "owner" && usableThumb(image)),
  );

  const bookingOf = (section: Extract<Section, { type: "booking" }>, key: string, id?: string) => (
    <BookingSection
      key={key}
      id={id}
      variant="soft"
      endpoint={bookingEndpoint}
      demo={ctx.demo}
      editable={editable}
      intro={section.intro}
      phone={business.phone}
      phoneHref={phoneHref}
      className="ns-s-bookwrap"
      heading={<h2 className="ns-s-bh2">{model.titleOf(section)}</h2>}
    />
  );

  const render = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    const id = model.anchorFor(section);
    // No site de verdade, serviços e agendamento ficam lado a lado no computador; no editor cada
    // seção tem a sua moldura, então ficam separadas.
    const next = spec.sections[index + 1];
    const previous = spec.sections[index - 1];
    switch (section.type) {
      case "hero":
        if (variant === "trade") return <TradeHero key={key} ctx={ctx} data={section} />;
        if (variant === "food") return <FoodHero key={key} ctx={ctx} data={section} />;
        if (variant === "pro") return <ProHero key={key} ctx={ctx} data={section} />;
        if (variant === "work") {
          // Portfólio: a galeria vem logo depois do topo (no editor cada seção fica no seu lugar).
          return (
            <div key={key}>
              <WorkHero ctx={ctx} data={section} showPhoto={!hasWorkImages} />
              {hoisted && <WorkGallery ctx={ctx} data={hoisted} id={model.anchorFor(hoisted)} />}
            </div>
          );
        }
        return (
          <div key={key}>
            <SoftHero ctx={ctx} data={section} />
            <SoftBanner ctx={ctx} />
            <SoftPopular ctx={ctx} />
          </div>
        );
      case "services": {
        const pairWith = !editable && next?.type === "booking" ? next : undefined;
        return (
          <Fragment key={key}>
            <Band>
              <div className="ns-s-cols">
                {variant === "beauty" ? (
                  <SoftServices ctx={ctx} data={section} id={id} />
                ) : (
                  <VariantServices ctx={ctx} data={section} id={id} />
                )}
                {pairWith && bookingOf(pairWith, `${key}-book`, model.anchorFor(pairWith))}
              </div>
            </Band>
            {variant === "trade" && <AreaChips ctx={ctx} id={anchors ? "area" : undefined} />}
          </Fragment>
        );
      }
      case "booking":
        if (!editable && previous?.type === "services") return null;
        return (
          <Band key={key}>
            <div className="ns-s-cols" data-solo="">
              {bookingOf(section, key, id)}
            </div>
          </Band>
        );
      case "about":
        return <SoftAbout key={key} ctx={ctx} data={section} id={id} />;
      case "gallery":
        if (variant === "work") {
          if (section === hoisted) return null;
          return <WorkGallery key={key} ctx={ctx} data={section} id={id} />;
        }
        return <SoftGallery key={key} ctx={ctx} data={section} id={id} />;
      case "testimonials":
        return <SoftTestimonials key={key} ctx={ctx} data={section} id={id} />;
      case "faq":
        return <SoftFaq key={key} ctx={ctx} data={section} id={id} />;
      case "contact":
        return (
          <SoftContact key={key} ctx={ctx} data={section} id={id} endpoint={contactEndpoint} />
        );
      default: {
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  // Barra flutuante do celular: só entram as abas que têm destino (sem telefone, some "Call").
  let slots: DockSlot[] = [];
  if (variant === "beauty") {
    const hasServices = model.links.some((link) => link.anchor === "services");
    slots = [{ key: "home", href: "#top", label: "Home" }];
    if (hasServices) slots.push({ key: "services", href: "#services", label: "Services" });
    if (hasBooking) {
      slots.push({
        key: "book",
        href: "#book",
        label: "Book",
        bookLink: true,
        fallbackHref: ctx.bookFallbackHref,
      });
    } else if (external) {
      slots.push({ key: "book", href: external, label: "Book", external: true });
    }
    if (phoneHref && business.phone) {
      slots.push({
        key: "call",
        href: phoneHref,
        label: "Call",
        ariaLabel: `Call ${business.phone}`,
      });
    }
  } else {
    slots = variantSlots(ctx, { area: hasAreaChips(ctx) });
  }
  const colors = actionColors(variant, spec.theme);
  const vars: VariantStyle = { "--v-action": colors.action, "--v-on-action": colors.on };

  return (
    <div id={anchors ? "top" : undefined} className="ns-soft" data-variant={variant} style={vars}>
      <SoftHeader ctx={ctx} cta={variant === "beauty" ? undefined : primaryCta(ctx)} />
      <main id={anchors ? "main" : undefined} className="ns-s-main">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <SoftFooter ctx={ctx} />
      {anchors && slots.length >= (variant === "beauty" ? 3 : 2) && <SoftDock slots={slots} />}
    </div>
  );
}
