import type { Section, SectionOf, SectionType } from "@nosweat/schema";
import type { ReactNode } from "react";
import { telHref } from "../../components/primitives";
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
  areaServed,
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
    sections.find((s): s is SectionOf<"hero"> => s.type === "hero")?.ctaLabel ?? "Contact us";
  const where = areaServed(business);
  const hasHeroCard = Boolean(business.hours?.length || firstTestimonial || business.phone);
  // Sem seção de contato (o dono removeu), o botão principal liga ou manda e-mail direto,
  // em vez de apontar para um #contact que não existe.
  const ctaHref = sections.some((s) => s.type === "contact")
    ? "#contact"
    : business.phone
      ? telHref(business.phone)
      : business.email
        ? `mailto:${business.email}`
        : "#top";

  const renderSection = (section: Section, index: number): ReactNode => {
    const key = `${section.type}-${index}`;
    switch (section.type) {
      case "hero":
        return (
          <Hero
            key={key}
            data={section}
            ctaHref={ctaHref}
            eyebrow={
              where && (
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-ns-border bg-ns-background px-4 py-1.5 text-sm font-medium">
                  <span className="size-2 rounded-full bg-ns-secondary" />
                  Serving {where}
                </p>
              )
            }
            actions={business.phone && <CallButton phone={business.phone} />}
            footer={<TrustBadges highlights={business.highlights} />}
            aside={
              hasHeroCard ? <HeroCard business={business} quote={firstTestimonial} /> : undefined
            }
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
              title: "What we can do for you",
              description: where ? `Proudly serving ${where}.` : undefined,
            }}
          />
        );
      case "testimonials":
        return (
          <Testimonials
            key={key}
            id={anchorFor("testimonials")}
            data={section}
            heading={{ eyebrow: "Reviews", title: "What our customers say" }}
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
              title: "Get in touch",
              description: "Tell us what you need and we'll get back to you.",
              align: "left",
            }}
            details={<ContactDetails business={business} />}
            submitLabel="Send request"
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
      <MobileCallBar phone={business.phone} ctaLabel={primaryCta} ctaHref={ctaHref} />
    </div>
  );
}
