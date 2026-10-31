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

/** Modelo do formulário de contato: os campos extras mudam com o tipo de negócio. */
export type FormPreset = "trade" | "appointment" | "catering" | "consultation" | "inquiry";

/** Vocabulário de cada ramo: títulos padrão das seções, rótulos do menu e o formulário. */
export type Vocabulary = {
  /** Rótulo do menu para os serviços ("Menu" num restaurante). */
  services: string;
  servicesTitle: string;
  about: string;
  aboutTitle: string;
  gallery: string;
  galleryTitle: string;
  testimonialsTitle: string;
  faqTitle: string;
  contactTitle: string;
  /** Negócio que recebe gente no endereço: "Find us"; senão, a área atendida. */
  visited: boolean;
  formPreset: FormPreset;
  submitLabel: string;
};

const VOCABULARY: Record<TemplateId, Vocabulary> = {
  "home-services": {
    services: "Services",
    servicesTitle: "Services",
    about: "About",
    aboutTitle: "About us",
    gallery: "Recent jobs",
    galleryTitle: "Recent jobs",
    testimonialsTitle: "Reviews",
    faqTitle: "Questions",
    contactTitle: "Contact us",
    visited: false,
    formPreset: "trade",
    submitLabel: "Send request",
  },
  beauty: {
    services: "Services",
    servicesTitle: "Services and prices",
    about: "About",
    aboutTitle: "About us",
    gallery: "Work",
    galleryTitle: "Recent work",
    testimonialsTitle: "Reviews",
    faqTitle: "Before your appointment",
    contactTitle: "Book your visit",
    visited: true,
    formPreset: "appointment",
    submitLabel: "Request an appointment",
  },
  restaurant: {
    services: "Menu",
    servicesTitle: "The menu",
    about: "Our story",
    aboutTitle: "Our story",
    gallery: "Gallery",
    galleryTitle: "Photos",
    testimonialsTitle: "Reviews",
    faqTitle: "Questions",
    contactTitle: "Visit us",
    visited: true,
    formPreset: "catering",
    submitLabel: "Send catering request",
  },
  professional: {
    services: "Services",
    servicesTitle: "Services",
    about: "About",
    aboutTitle: "About us",
    gallery: "Work",
    galleryTitle: "Our work",
    testimonialsTitle: "Reviews",
    faqTitle: "Questions",
    contactTitle: "Book a consultation",
    visited: false,
    formPreset: "consultation",
    submitLabel: "Request a consultation",
  },
  portfolio: {
    services: "Packages",
    servicesTitle: "Packages",
    about: "About",
    aboutTitle: "About",
    gallery: "Work",
    galleryTitle: "Work",
    testimonialsTitle: "Reviews",
    faqTitle: "Questions",
    contactTitle: "Start a project",
    visited: false,
    formPreset: "inquiry",
    submitLabel: "Send inquiry",
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
  /** O botão principal leva para outro site (agendamento, pedido online): abre em nova aba. */
  ctaExternal: boolean;
  phoneHref?: string;
  /** Rota no Google Maps (só com endereço de rua informado pelo dono). */
  directionsHref?: string;
  /** Área atendida (ou cidade/estado). */
  where?: string;
  /** Rótulo da área: "Serving" (área informada pelo dono) ou "Based in" (só a cidade). */
  areaLabel: string;
  /** Endereço de rua completo numa linha, se o dono informou. */
  address?: string;
  primaryAction: PrimaryAction;
  words: Vocabulary;
  /** Estilo das peças repetidas, sorteado pelo nome (ver siteStyle). */
  style: SiteStyle;
  /** Título da seção: o do dono, senão o padrão do ramo. */
  titleOf: (section: Section) => string;
};

export function location(business: Business): string | undefined {
  return [business.city, business.state].filter(Boolean).join(", ") || undefined;
}

/** Área atendida informada pelo dono; sem ela, a cidade/estado do negócio. */
export function areaServed(business: Business): string | undefined {
  return business.serviceArea?.trim() || location(business);
}

/** Endereço completo numa linha ("2112 Logan Ave, San Diego, CA"), se houver rua. */
export function fullAddress(business: Business): string | undefined {
  const street = business.address?.trim();
  if (!street) return undefined;
  return [street, location(business)].filter(Boolean).join(", ");
}

/** Busca do Google Maps (sem chave de API): abre a rota no app de mapas do celular. */
export function directionsHrefFor(business: Business): string | undefined {
  const address = fullAddress(business);
  if (!address) return undefined;
  const query = encodeURIComponent(`${business.name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Link para fora do site (abre em nova aba com rel="noopener"). */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Atributos de um link externo; links internos (#, tel:, mailto:) ficam sem nada. */
export function externalProps(href: string): { target?: string; rel?: string } {
  return isExternal(href) ? { target: "_blank", rel: "noopener" } : {};
}

const NAV_ANCHORS: Partial<Record<SectionType, string>> = {
  services: "services",
  gallery: "work",
  about: "about",
  testimonials: "reviews",
  faq: "faq",
  contact: "contact",
};

/** Foto do dono (a única que pode aparecer como "nosso trabalho" ou "nossa equipe"). */
export function isOwnerPhoto<T extends { kind: string }>(image: T | undefined): image is T {
  return image?.kind === "owner";
}

/** Seção que não aparece (galeria sem fotos do dono) não entra no menu nem ganha âncora. */
export function isVisible(section: Section): boolean {
  if (section.type === "gallery") return section.images.some((image) => isOwnerPhoto(image));
  if (section.type === "services") return section.items.length > 0;
  return true;
}

/**
 * Estilo das peças repetidas (cabeçalho, botões, contato), sorteado pelo nome do negócio para
 * dois sites com a mesma composição não terem a mesma cara. Sempre o mesmo para o mesmo nome.
 */
export type HeaderStyle = "classic" | "centered" | "bar" | "minimal";
export type ButtonStyle = "pill" | "sharp" | "line" | "caps";
export type ContactStyle = "split" | "stacked" | "letter";
export type SiteStyle = { header: HeaderStyle; buttons: ButtonStyle; contact: ContactStyle };

const HEADER_STYLES: readonly HeaderStyle[] = ["classic", "centered", "bar", "minimal"];
const BUTTON_STYLES: readonly ButtonStyle[] = ["pill", "sharp", "line", "caps"];
const CONTACT_STYLES: readonly ContactStyle[] = ["split", "stacked", "letter"];

/** Hash pequeno e estável (FNV-1a) do texto. */
function hashOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function siteStyle(spec: SiteSpec): SiteStyle {
  const seed = hashOf(spec.business.name.trim().toLowerCase());
  return {
    header: HEADER_STYLES[seed % HEADER_STYLES.length] ?? "classic",
    // Escolhido pelo dono (ou pela IA) em `design.buttons`; senão, sorteado pelo nome.
    buttons:
      spec.design?.buttons ?? BUTTON_STYLES[Math.floor(seed / 7) % BUTTON_STYLES.length] ?? "sharp",
    contact: CONTACT_STYLES[Math.floor(seed / 31) % CONTACT_STYLES.length] ?? "split",
  };
}

export function buildModel(spec: SiteSpec, withAnchors = true): SiteModel {
  const { business, sections } = spec;
  const words = VOCABULARY[spec.template];
  const labels: Partial<Record<SectionType, string>> = {
    services: words.services,
    gallery: words.gallery,
    about: words.about,
    testimonials: "Reviews",
    faq: "FAQ",
    contact: "Contact",
  };
  const defaultTitles: Record<SectionType, string> = {
    hero: "",
    services: words.servicesTitle,
    gallery: words.galleryTitle,
    about: words.aboutTitle,
    testimonials: words.testimonialsTitle,
    faq: words.faqTitle,
    contact: words.contactTitle,
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
  // Link de agendamento/pedido do dono vem primeiro; sem ele, o contato da página. Sem seção de
  // contato, o botão principal liga ou manda e-mail direto.
  const external = business.links?.booking ?? business.links?.order;
  const ctaHref =
    external ??
    (sections.some((s) => s.type === "contact")
      ? "#contact"
      : (phoneHref ?? (business.email ? `mailto:${business.email}` : "#top")));

  const planned = spec.design?.primaryAction;
  // "Ligar" só é a ação principal quando existe telefone.
  const primaryAction: PrimaryAction =
    planned === "call" && !phoneHref ? "quote" : (planned ?? (phoneHref ? "call" : "quote"));

  const directionsHref = directionsHrefFor(business);

  return {
    spec,
    business,
    hero,
    links,
    anchorFor: (section) => (withAnchors ? anchors.get(section) : undefined),
    ctaHref,
    ctaLabel: hero?.ctaLabel ?? "Contact us",
    ctaExternal: isExternal(ctaHref),
    phoneHref,
    directionsHref,
    where: areaServed(business),
    areaLabel: business.serviceArea?.trim() ? "Serving" : "Based in",
    address: fullAddress(business),
    primaryAction,
    words,
    style: siteStyle(spec),
    titleOf: (section) =>
      (section.type === "hero" ? "" : section.title?.trim()) || defaultTitles[section.type],
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
