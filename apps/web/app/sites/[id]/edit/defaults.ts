import type { Section, SectionType } from "@nosweat/schema";
import { PLACEHOLDERS as P } from "@/lib/placeholders";

/** Conteúdo inicial de cada tipo de seção quando o cliente adiciona uma nova. */
export function newSection(type: SectionType): Section {
  switch (type) {
    case "hero":
      return {
        type,
        title: P.heroTitle,
        subtitle: P.heroSubtitle,
        ctaLabel: "Get in Touch",
      };
    case "services":
      return { type, items: [{ name: P.serviceName, description: P.serviceDescription }] };
    case "testimonials":
      return {
        type,
        items: [{ quote: P.reviewQuote, author: P.reviewAuthor }],
      };
    case "faq":
      return { type, items: [{ q: P.faqQuestion, a: P.faqAnswer }] };
    case "contact":
      return { type, showForm: true, showMap: true };
    case "gallery":
      // Só fotos do dono: começa vazia e o cliente envia as fotos.
      return { type, images: [] };
  }
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero (top of the page)",
  services: "Services",
  testimonials: "Reviews",
  faq: "FAQ",
  contact: "Contact",
  gallery: "Photo gallery (your photos)",
};

/** Limite de itens de cada lista (o mesmo do schema). */
export const MAX_ITEMS = { services: 8, testimonials: 6, faq: 10 } as const;
