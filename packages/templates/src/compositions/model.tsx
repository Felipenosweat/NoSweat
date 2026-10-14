import type {
  Business,
  Composition,
  PrimaryAction,
  Section,
  SectionOf,
  SectionType,
  SiteSpec,
  TemplateId,
} from "@nosweat/schema";
import type { ReactNode } from "react";
import { EditableSection } from "../EditableSection";
import { telHref } from "../components/primitives";

// Base comum de todas as composições: menu, âncoras, destino do botão principal, ordem das
// ações e o laço que desenha as seções (com a moldura do editor quando `editable`).
// Cada composição decide só COMO cada parte aparece.

/** Sem `spec.design` (sites antigos), a página continua igual: composição "service-led". */
export function compositionOf(spec: SiteSpec): Composition {
  return spec.design?.composition ?? "service-led";
}

type NavItem = { anchor: string; label: string };

/** Vocabulário de cada ramo: os títulos fixos das seções mudam com o tipo de negócio. */
const VOCABULARY: Record<
  TemplateId,
  { services: string; servicesTitle: string; contactTitle: string; faqTitle: string }
> = {
  "home-services": {
    services: "Services",
    servicesTitle: "What we can do for you",
    contactTitle: "Tell us what you need",
    faqTitle: "Good questions, straight answers",
  },
  beauty: {
    services: "Services",
    servicesTitle: "Services and treatments",
    contactTitle: "Book your visit",
    faqTitle: "Before your appointment",
  },
  restaurant: {
    services: "Menu",
    servicesTitle: "From our kitchen",
    contactTitle: "Come by or get in touch",
    faqTitle: "Good to know",
  },
  professional: {
    services: "Services",
    servicesTitle: "How we can help",
    contactTitle: "Start a conversation",
    faqTitle: "Common questions",
  },
  portfolio: {
    services: "Services",
    servicesTitle: "What's on offer",
    contactTitle: "Start a project",
    faqTitle: "Working together",
  },
};

export type SiteModel = {
  spec: SiteSpec;
  business: Business;
  hero?: SectionOf<"hero">;
  links: NavItem[];
  /** Âncora da primeira seção de cada tipo (as repetidas ficam sem id). */
  anchorFor: (section: Section) => string | undefined;
  /** Destino do botão principal do topo. */
  ctaHref: string;
  ctaLabel: string;
  phoneHref?: string;
  where?: string;
  primaryAction: PrimaryAction;
  words: (typeof VOCABULARY)[TemplateId];
};

export function location(business: Business): string | undefined {
  return [business.city, business.state].filter(Boolean).join(", ") || undefined;
}

/** Área atendida informada pelo dono; sem ela, a cidade/estado do negócio. */
export function areaServed(business: Business): string | undefined {
  return business.serviceArea?.trim() || location(business);
}

const NAV_ANCHORS: Partial<Record<SectionType, string>> = {
  services: "services",
  gallery: "work",
  testimonials: "reviews",
  faq: "faq",
  contact: "contact",
};

/** Seção que não aparece (galeria sem fotos do dono) não entra no menu nem ganha âncora. */
export function isVisible(section: Section): boolean {
  return section.type !== "gallery" || section.images.some((image) => image.kind === "owner");
}

export function buildModel(spec: SiteSpec): SiteModel {
  const { business, sections } = spec;
  const words = VOCABULARY[spec.template];
  const labels: Partial<Record<SectionType, string>> = {
    services: words.services,
    gallery: "Our work",
    testimonials: "Reviews",
    faq: "FAQ",
    contact: "Contact",
  };

  const anchors = new Map<Section, string>();
  const used = new Set<SectionType>();
  for (const section of sections) {
    const anchor = NAV_ANCHORS[section.type];
    if (!anchor || used.has(section.type) || !isVisible(section)) continue;
    used.add(section.type);
    anchors.set(section, anchor);
  }
  const links = [...anchors.entries()].map(([section, anchor]) => ({
    anchor,
    label: labels[section.type] ?? anchor,
  }));

  const hero = sections.find((s): s is SectionOf<"hero"> => s.type === "hero");
  const phoneHref = business.phone ? telHref(business.phone) : undefined;
  // Sem seção de contato, o botão principal liga ou manda e-mail direto.
  const ctaHref = sections.some((s) => s.type === "contact")
    ? "#contact"
    : (phoneHref ?? (business.email ? `mailto:${business.email}` : "#top"));

  const planned = spec.design?.primaryAction;
  // "Ligar" só é a ação principal quando existe telefone.
  const primaryAction: PrimaryAction =
    planned === "call" && !phoneHref ? "quote" : (planned ?? (phoneHref ? "call" : "quote"));

  return {
    spec,
    business,
    hero,
    links,
    anchorFor: (section) => anchors.get(section),
    ctaHref,
    ctaLabel: hero?.ctaLabel ?? "Contact us",
    phoneHref,
    where: areaServed(business),
    primaryAction,
    words,
  };
}

/**
 * Desenha as seções na ordem do SiteSpec. No editor, cada uma ganha a moldura clicável.
 * `render` devolve `null` para seções que a composição já mostrou em outro lugar.
 */
export function renderSections(
  spec: SiteSpec,
  render: (section: Section, index: number) => ReactNode,
  editable: boolean,
  selectedSection: number | null,
): ReactNode {
  if (!editable) return spec.sections.map(render);
  return spec.sections.map((section, index) => (
    <EditableSection
      key={`${section.type}-${index}`}
      index={index}
      type={section.type}
      selected={selectedSection === index}
    >
      {render(section, index)}
    </EditableSection>
  ));
}
