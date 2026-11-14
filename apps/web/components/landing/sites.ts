// Os seis sites de exemplo da landing (negócios fictícios). Cada um tem a captura de verdade em
// public/landing/signature/<slug>-d.webp e a página inteira em /examples/<slug>.

export const SITES = [
  { slug: "still-water-spa", name: "Still Water Spa", kind: "Day spa", place: "Scottsdale" },
  { slug: "smoke-and-rail-bbq", name: "Smoke & Rail BBQ", kind: "Barbecue", place: "Kansas City" },
  { slug: "mercer-law", name: "Mercer Law", kind: "Family law", place: "Columbus" },
  {
    slug: "greenline-landscaping",
    name: "Greenline Landscaping",
    kind: "Landscaping",
    place: "Charlotte",
  },
  { slug: "fade-and-co-barbers", name: "Fade & Co. Barbers", kind: "Barbershop", place: "Chicago" },
  { slug: "sunrise-bakery", name: "Sunrise Bakery", kind: "Bakery", place: "Sacramento" },
] as const;
