import type { SiteSpec } from "@nosweat/schema";

// Textos de exemplo que o editor coloca numa seção nova. Nunca podem ir ao ar: um depoimento
// de exemplo publicado seria uma afirmação inventada (regra 8 do CLAUDE.md).
export const PLACEHOLDERS = {
  heroTitle: "Your headline here",
  heroSubtitle: "Tell visitors what you do and why they should choose you.",
  serviceName: "New service",
  serviceDescription: "Describe this service.",
  reviewQuote: "Paste a real customer review here.",
  reviewAuthor: "Customer name",
  faqQuestion: "A question customers ask",
  faqAnswer: "Your answer.",
} as const;

const ALL: ReadonlySet<string> = new Set(Object.values(PLACEHOLDERS));

/** Textos de exemplo que ainda estão no site (vazio = pode publicar). */
export function placeholdersIn(spec: SiteSpec): string[] {
  const found = new Set<string>();
  const check = (value: string) => {
    if (ALL.has(value.trim())) found.add(value.trim());
  };
  for (const section of spec.sections) {
    switch (section.type) {
      case "hero":
        check(section.title);
        check(section.subtitle);
        break;
      case "services":
        for (const item of section.items) {
          check(item.name);
          check(item.description);
        }
        break;
      case "testimonials":
        for (const item of section.items) {
          check(item.quote);
          check(item.author);
        }
        break;
      case "faq":
        for (const item of section.items) {
          check(item.q);
          check(item.a);
        }
        break;
      case "contact":
        break;
    }
  }
  return [...found];
}
