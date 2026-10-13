import type { Section, SectionOf, SectionType } from "@nosweat/schema";
import type { ReactNode } from "react";
import { Contact, Faq, Gallery, Hero, Services, Testimonials } from "../../sections";
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

  // Seção que não aparece (ex.: galeria sem fotos do dono) não entra no menu.
  const visible = sections.filter(
    (s) => s.type !== "gallery" || s.images.some((image) => image.kind === "owner"),
  );
  const links = [...new Set(visible.map((s) => s.type))].flatMap((type) => {
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
  // Card só com o telefone: no topo empilhado (celular/tablet) ele seria a terceira ação de
  // ligar seguida (botão do hero e barra fixa), então só aparece com o topo em duas colunas.
  const heroCardPhoneOnly = !business.hours?.length && !firstTestimonial;

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
                <p className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-ns-border bg-ns-background px-4 py-1.5 text-sm font-medium [overflow-wrap:anywhere]">
                  <span className="size-2 shrink-0 rounded-full bg-ns-secondary" />
                  Serving {where}
                </p>
              )
            }
            actions={business.phone && <CallButton phone={business.phone} />}
            footer={<TrustBadges highlights={business.highlights} />}
            aside={
              hasHeroCard ? <HeroCard business={business} quote={firstTestimonial} /> : undefined
            }
            asideWideOnly={heroCardPhoneOnly}
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
      case "gallery":
        return (
          <Gallery
            key={key}
            id={visible.includes(section) ? anchorFor("gallery") : undefined}
            data={section}
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
      <MobileCallBar phone={business.phone} ctaLabel={primaryCta} />
    </div>
  );
}
