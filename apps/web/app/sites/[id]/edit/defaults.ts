import type { Section, SectionType } from "@nosweat/schema";

/** Conteúdo inicial de cada tipo de seção quando o cliente adiciona uma nova. */
export function newSection(type: SectionType): Section {
  switch (type) {
    case "hero":
      return {
        type,
        title: "Your headline here",
        subtitle: "Tell visitors what you do and why they should choose you.",
        ctaLabel: "Get in Touch",
      };
    case "services":
      return { type, items: [{ name: "New service", description: "Describe this service." }] };
    case "testimonials":
      return {
        type,
        items: [{ quote: "Paste a real customer review here.", author: "Customer name" }],
      };
    case "faq":
      return { type, items: [{ q: "A question customers ask", a: "Your answer." }] };
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
