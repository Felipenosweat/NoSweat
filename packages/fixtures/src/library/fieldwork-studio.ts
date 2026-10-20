import type { ModelEntry } from "./types";

// Modelo de portfólio: estúdio de identidade visual em Richmond (composição "service-led").
// Papel claro, tinta preta e um vermelhão como única cor de ação. Uma foto de embalagem no topo
// (kind "owner", papel de foto do estúdio; Flickr, CC BY 2.0, crédito em `credit`). Sem galeria:
// o resto do lote tinha marcas de terceiros, texto por cima, licença ND ou fotos amadoras.
// Clientes recentes e o processo ficam no "about". Todo fato do site está no brief (regra 8).
export const fieldworkStudio: ModelEntry = {
  slug: "fieldwork-studio",
  category: "portfolio",
  keywords: [
    "graphic designer",
    "graphic design",
    "branding",
    "brand identity",
    "logo design",
    "logo",
    "packaging design",
    "label design",
    "visual identity",
    "design studio",
    "freelance designer",
  ],
  brief: [
    "Fieldwork Studio is my branding and graphic design studio at 3201 W Leigh St, Studio 4 in Scott's Addition, Richmond, VA. I'm Sam Okafor; I've designed brands for 12 years, the first 7 at an agency downtown. Ellie Park joins me part-time on packaging production and print.",
    "Logo & mark from $2,800 (3–4 weeks), full brand identity from $8,500 (6–8 weeks: logo, type, color, a brand guide and your first business cards), packaging & labels from $4,000 per product line, brand refresh from $5,500 (4–6 weeks), and a design day for $950 (one day, one problem solved).",
    "Every project runs the same four steps: a 90-minute kickoff, two directions in week two, one direction refined over two rounds of changes, then final files and a brand guide. 50% to start, 50% at delivery. You own every file once the last invoice is paid.",
    "Recent work: labels for Tidewater Cider (2025), the identity for Carytown Bike Co. (2025) and packaging for Juniper & Pine Bakery (2024). I work with businesses in Richmond and across Virginia, and remotely anywhere.",
    'Clients said: "Sam asked about our customers for an hour before he drew a single thing. The labels doubled our shelf space at two grocers." (Marcus Lee, Tidewater Cider) and "The brand guide is the first one we\'ve ever actually used." (Anna Whitfield, Carytown Bike Co.)',
    "Studio hours Mon–Thu 9 AM – 5 PM. (804) 555-0193, studio@fieldwork.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "portfolio",
    design: {
      composition: "service-led",
      primaryAction: "quote",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "A one-person branding studio with clear prices: services in rows like a rate card, process and clients right after.",
    },
    business: {
      name: "Fieldwork Studio",
      category: "Branding & graphic design",
      phone: "(804) 555-0193",
      email: "studio@fieldwork.example.com",
      address: "3201 W Leigh St, Studio 4",
      city: "Richmond",
      state: "VA",
      serviceArea: "Richmond and across Virginia, remote anywhere",
      hours: [{ days: "Mon–Thu", time: "9 AM – 5 PM" }],
      highlights: ["You own every file", "Two rounds of changes", "50% to start"],
    },
    theme: {
      primary: "#B8381F",
      secondary: "#2F4A3A",
      background: "#F7F5EF",
      text: "#1B1B1B",
      font: "technical",
    },
    sections: [
      {
        type: "hero",
        title: "Brands for Richmond businesses that make real things",
        subtitle:
          "Logos, identities and packaging for cideries, bakeries, bike shops and the people who run them. Same four steps every time, from kickoff to final files.",
        ctaLabel: "Start a project",
        image: {
          url: "/photos/models/fieldwork-studio-16.webp",
          alt: "Three printed boxes in red, teal and mustard beside a white bottle with tablets spilled on a gray table",
          source: "upload",
          kind: "owner",
          credit: {
            name: "SOCIALisBETTER",
            url: "https://www.flickr.com/photos/27620885@N02/2602771763",
          },
          width: 500,
          height: 375,
          focus: "50% 55%",
        },
      },
      {
        type: "services",
        title: "What I make, and what it costs",
        items: [
          {
            name: "Full brand identity",
            description:
              "Logo, type, color, a brand guide and your first business cards. Everything you need to look like yourself everywhere.",
            price: "from $8,500",
            detail: "6–8 weeks",
          },
          {
            name: "Logo & mark",
            description: "A wordmark and a symbol, in every file format a printer will ask for.",
            price: "from $2,800",
            detail: "3–4 weeks",
          },
          {
            name: "Packaging & labels",
            description:
              "Cans, bottles, bags and boxes, designed for the shelf and ready for print.",
            price: "from $4,000",
            detail: "Per product line",
          },
          {
            name: "Brand refresh",
            description: "Keep what customers already recognize, fix what's holding you back.",
            price: "from $5,500",
            detail: "4–6 weeks",
          },
          {
            name: "Design day",
            description:
              "One day, one problem solved: a menu, a sign, a pitch deck, a trade show booth.",
            price: "$950",
            detail: "1 day",
          },
        ],
      },
      {
        type: "about",
        title: "How a project runs",
        body: "Every project runs the same four steps: a 90-minute kickoff, two directions in week two, one direction refined over two rounds of changes, then final files and a brand guide.\n\nRecent work: labels for Tidewater Cider (2025), the identity for Carytown Bike Co. (2025) and packaging for Juniper & Pine Bakery (2024).",
        people: [
          {
            name: "Sam Okafor",
            role: "Designer & founder",
            note: "Designing brands for 12 years, the first 7 at an agency downtown.",
          },
          {
            name: "Ellie Park",
            role: "Packaging production & print",
            note: "Joins part-time to take packaging from screen to press.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "From clients",
        items: [
          {
            quote:
              "Sam asked about our customers for an hour before he drew a single thing. The labels doubled our shelf space at two grocers.",
            author: "Marcus Lee, Tidewater Cider",
          },
          {
            quote: "The brand guide is the first one we've ever actually used.",
            author: "Anna Whitfield, Carytown Bike Co.",
          },
        ],
      },
      {
        type: "faq",
        title: "Working together",
        items: [
          {
            q: "How does payment work?",
            a: "50% to start, 50% at delivery.",
          },
          {
            q: "How many changes do I get?",
            a: "After you pick one of the two directions, two rounds of changes are included.",
          },
          {
            q: "Who owns the files?",
            a: "You own every file once the last invoice is paid.",
          },
          {
            q: "Do you only work in Richmond?",
            a: "Most clients are in Richmond and across Virginia, but I work remotely anywhere.",
          },
          {
            q: "Can I visit the studio?",
            a: "Yes, Mon–Thu 9 AM – 5 PM, at 3201 W Leigh St in Scott's Addition.",
          },
        ],
      },
      {
        type: "contact",
        title: "Start a project",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
