import type { Section, SectionOf, SectionType } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Contact, Faq, Hero, Services, Testimonials } from "../../sections";
import type { TemplateProps } from "../../types";
import { NAV, SERVICE_ICONS } from "./content";
import {
  CallButton,
  ContactDetails,
  Footer,
  Header,
  HeroCard,
  MobileCallBar,
  TopBar,
  TrustBadges,
  location,
} from "./parts";

/**
 * Template de prestador de serviço (encanador, eletricista, jardinagem...).
 * Telefone sempre à vista: barra do topo, cabeçalho fixo, hero e barra fixa no celular.
 */
export function HomeServicesTemplate({ spec, contactEndpoint }: TemplateProps) {
  const { business, sections } = spec;

  // Só a primeira seção de cada tipo recebe âncora (#services, #reviews...), para não duplicar ids.
  const anchored = new Set<SectionType>();
  const anchorFor = (type: SectionType): string | undefined => {
    const nav = NAV[type];
    if (!nav || anchored.has(type)) return undefined;
    anchored.add(type);
    return nav.anchor;
  };

  const links = [...new Set(sections.map((s) => s.type))].flatMap((type) => {
    const nav = NAV[type];
    return nav ? [nav] : [];
  });

  const firstTestimonial = sections.find(
    (s): s is SectionOf<"testimonials"> => s.type === "testimonials",
  )?.items[0];
  const primaryCta =
    sections.find((s): s is SectionOf<"hero"> => s.type === "hero")?.ctaLabel ?? "Free estimate";
  const where = location(business);

  const renderSection = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    switch (section.type) {
      case "hero":
        return (
          <Hero
            key={key}
            data={section}
            eyebrow={
              where && (
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-ns-border bg-ns-background px-4 py-1.5 text-sm font-medium">
                  <span className="size-2 rounded-full bg-ns-secondary" />
                  Now booking in {where}
                </p>
              )
            }
            actions={business.phone && <CallButton phone={business.phone} />}
            footer={<TrustBadges />}
            aside={<HeroCard business={business} quote={firstTestimonial} />}
          />
        );
      case "services":
        return (
          <Services
            key={key}
            id={anchorFor("services")}
            data={section}
            icons={SERVICE_ICONS}
            heading={{
              eyebrow: "Our services",
              title: "Expert help for every job, big or small",
              description: where
                ? `Fast, reliable service for homes and businesses across ${where}.`
                : "Fast, reliable service for homes and businesses.",
            }}
          />
        );
      case "testimonials":
        return (
          <Testimonials
            key={key}
            id={anchorFor("testimonials")}
            data={section}
            heading={{ eyebrow: "Reviews", title: "Trusted by your neighbors" }}
          />
        );
      case "faq":
        return <Faq key={key} id={anchorFor("faq")} data={section} />;
      case "contact":
        return (
          <Contact
            key={key}
            id={anchorFor("contact")}
            data={section}
            heading={{
              eyebrow: "Contact",
              title: "Request your free estimate",
              description: "Tell us what's going on and we'll get you a fast, honest quote.",
              align: "left",
            }}
            details={<ContactDetails business={business} />}
            submitLabel="Request estimate"
            endpoint={contactEndpoint}
          />
        );
      default: {
        // Se um tipo novo de seção entrar no schema, o TypeScript aponta aqui.
        const unhandled: never = section;
        return unhandled;
      }
    }
  };

  return (
    <div id="top" className="flex min-h-full flex-col">
      <TopBar business={business} />
      <Header business={business} links={links} />
      <main className="flex-1">{sections.map(renderSection)}</main>
      <Footer business={business} links={links} />
      <MobileCallBar phone={business.phone} ctaLabel={primaryCta} />
    </div>
  );
}
