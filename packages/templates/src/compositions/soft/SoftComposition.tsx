import type { Section } from "@nosweat/schema";
import type { ReactNode } from "react";
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
import { demoServicesFrom } from "./soft-data";

// Composição "soft" (só o ramo de beleza): o site com a cara de um app de salão. Tudo visível de
// início (sem revelar ao rolar), sem paralaxe e sem zoom nas fotos. Os estilos moram em styles.css
// sob `.ns-soft`; o resto dos ramos continua no molde Signature.

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
  const { business, phoneHref } = model;
  const hasBooking = spec.sections.some((section) => section.type === "booking");
  const hasContact = spec.sections.some((section) => section.type === "contact");
  const external = business.links?.booking;
  const ctx: SoftCtx = {
    model,
    spec,
    hasBooking,
    bookingEndpoint,
    demo: bookingDemo
      ? { services: demoServicesFrom(spec), businessName: business.name }
      : undefined,
    hasContact,
    bookFallbackHref: external ?? phoneHref ?? (hasContact ? "#contact" : model.ctaHref),
  };

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
          <Band key={key}>
            <div className="ns-s-cols">
              <SoftServices ctx={ctx} data={section} id={id} />
              {pairWith && bookingOf(pairWith, `${key}-book`, model.anchorFor(pairWith))}
            </div>
          </Band>
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
  const hasServices = model.links.some((link) => link.anchor === "services");
  const slots: DockSlot[] = [{ key: "home", href: "#top", label: "Home" }];
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

  return (
    <div id={anchors ? "top" : undefined} className="ns-soft">
      <SoftHeader ctx={ctx} />
      <main id={anchors ? "main" : undefined} className="ns-s-main">
        {renderSections(spec, render, editable, selectedSection)}
      </main>
      <SoftFooter ctx={ctx} />
      {anchors && slots.length >= 3 && <SoftDock slots={slots} />}
    </div>
  );
}
