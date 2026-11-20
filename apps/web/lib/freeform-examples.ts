// Exemplos "código livre" (experimento caminho A, ver docs na branch do experimento): páginas
// HTML inteiras que a IA escreveu para negócios FICTÍCIOS, revisadas e salvas como arquivos
// estáticos em public/examples/files/<slug>.html. Não são SiteSpec e não passam pelo renderer.
//
// Segurança: o HTML tem JavaScript (GSAP). Ele nunca roda na origem da nosweatfd.com:
// - o next.config.ts manda `Content-Security-Policy: sandbox ...` em /examples/files/*, então
//   mesmo aberto direto o documento fica numa origem opaca (sem cookies, sessão nem /api);
// - /examples/<slug> o mostra num <iframe sandbox="allow-scripts"> sem allow-same-origin
//   (nem allow-forms: o formulário de exemplo não envia nada).
// Fotos do Unsplash por hotlink (como pedem os termos), com crédito no rodapé de cada página.

export type FreeformExample = {
  slug: string;
  name: string;
  kind: string;
  place: string;
};

export const FREEFORM_EXAMPLES: FreeformExample[] = [
  { slug: "brisket-and-ember", name: "Brisket & Ember", kind: "Barbecue", place: "Lockhart, TX" },
  { slug: "sals-barber-shop", name: "Sal's Barber Shop", kind: "Barbershop", place: "Providence" },
  { slug: "marisol-vega-law", name: "Marisol Vega Law", kind: "Family law", place: "Tucson" },
  { slug: "fade-theory", name: "Fade Theory", kind: "Barber studio", place: "Austin" },
  {
    slug: "greenway-landscaping",
    name: "Greenway Landscaping",
    kind: "Landscaping",
    place: "Overland Park",
  },
  { slug: "little-crumb-bakery", name: "Little Crumb Bakery", kind: "Bakery", place: "Burlington" },
];

export function freeformExample(slug: string): FreeformExample | null {
  return FREEFORM_EXAMPLES.find((example) => example.slug === slug) ?? null;
}

/** Endereço do arquivo estático (servido com CSP sandbox, ver next.config.ts). */
export const freeformExampleFile = (slug: string) => `/examples/files/${slug}.html`;
