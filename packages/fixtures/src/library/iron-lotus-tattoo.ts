import type { ModelEntry } from "./types";

// Modelo de portfólio: estúdio de tatuagem em Denver (composição "typographic").
// O topo é um bloco verde-jade com a frase e, embaixo, uma faixa de foto (mão de luva com a
// máquina, sem rosto; kind "owner", papel de foto do estúdio; Wikimedia Commons, CC BY-SA 3.0,
// crédito em `credit`). Sem galeria: o lote não tinha nenhuma tatuagem pronta que passasse
// (rostos, marca d'água, licença ND ou foto amadora). O trabalho aparece como livro-caixa de
// serviços e os artistas no "about". Todo fato do site está no brief (regra 8).
export const ironLotusTattoo: ModelEntry = {
  slug: "iron-lotus-tattoo",
  category: "portfolio",
  keywords: [
    "tattoo",
    "tattoo studio",
    "tattoo shop",
    "tattoo artist",
    "fine line",
    "cover-up",
    "blackwork",
    "custom tattoo",
    "flash",
    "piercing",
    "ink",
  ],
  brief: [
    "Iron Lotus Tattoo is a private custom studio at 2817 Larimer St in RiNo, Denver, CO. I'm Mara Quinn, owner; I've tattooed since 2011 and do blackwork and large custom pieces. Theo Banks does fine line and script. Lena Ruiz does color realism and cover-ups.",
    "Custom work is $180 an hour, starting with a consult and a drawing session. Fine line and script from $150, most pieces take 1–2 hours. Cover-ups and reworks are $180 an hour after a free consult. Full-day sessions are $1,100 for up to 6 hours, for sleeves and back pieces. Flash Fridays: walk-in flash from $100, first come. Touch-ups are free within 6 months.",
    "Booking: a $100 deposit holds your date and comes off the price of your last session. You can move your appointment once with 48 hours notice and keep the deposit. You must be 18+ with a valid photo ID. We show the drawing on the day of your appointment, not before, and change it with you until it's right.",
    "Open Tue–Sat 12 PM – 8 PM. Book online at ironlotus.example.com/book.",
    'Clients said: "Mara took a half-faded name on my arm and turned it into the best thing on my body." (Chris D.) and "Theo\'s lines are so clean my mom asked if it was a sticker." (Priya N.)',
    "(303) 555-0126, book@ironlotus.example.com.",
    "Style: bold",
  ].join("\n"),
  spec: {
    version: 1,
    template: "portfolio",
    design: {
      composition: "typographic",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "A custom tattoo studio: the headline is the image, one close photo of the work under it, prices and policies read like a shop board.",
    },
    business: {
      name: "Iron Lotus Tattoo",
      category: "Tattoo studio",
      phone: "(303) 555-0126",
      email: "book@ironlotus.example.com",
      address: "2817 Larimer St",
      city: "Denver",
      state: "CO",
      hours: [{ days: "Tue–Sat", time: "12 PM – 8 PM" }],
      highlights: ["18+ with photo ID", "$100 deposit holds your date", "Free touch-ups, 6 months"],
      links: { booking: "https://ironlotus.example.com/book" },
    },
    theme: {
      primary: "#14453D",
      secondary: "#D98E48",
      background: "#F2EEE6",
      text: "#151515",
      font: "bold",
    },
    sections: [
      {
        type: "hero",
        title: "Custom tattoos in RiNo, Denver",
        subtitle:
          "Iron Lotus is a private studio on Larimer St, where Mara, Theo and Lena do blackwork, fine line, color realism and cover-ups. We change every drawing with you until it's right.",
        ctaLabel: "Book a consult",
        image: {
          url: "/photos/models/iron-lotus-tattoo-11.webp",
          alt: "A tattooer's gloved hand holding a coil machine over two caps of ink, a tattooed forearm behind it",
          source: "upload",
          kind: "owner",
          credit: {
            name: "Franki2001 (Wikimedia Commons)",
            url: "https://commons.wikimedia.org/w/index.php?curid=568642",
          },
          width: 900,
          height: 600,
          focus: "45% 55%",
        },
      },
      {
        type: "services",
        title: "Services and prices",
        items: [
          {
            name: "Custom pieces",
            description:
              "We draw your idea from scratch, starting with a consult and a drawing session.",
            price: "$180 an hour",
            detail: "Consult + drawing session",
          },
          {
            name: "Fine line & script",
            description:
              "Theo does small, precise work like names, dates and single-needle detail.",
            price: "from $150",
            detail: "Most pieces 1–2 hours",
          },
          {
            name: "Cover-ups & reworks",
            description:
              "Lena covers or reworks old tattoos, and she looks at yours first in a free consult.",
            price: "$180 an hour",
            detail: "Free consult first",
          },
          {
            name: "Full-day sessions",
            description: "Up to 6 hours in one sitting, for sleeves and back pieces.",
            price: "$1,100",
            detail: "Up to 6 hours",
          },
          {
            name: "Flash Fridays",
            description: "Walk in on a Friday and pick from the flash, first come.",
            price: "from $100",
            detail: "Walk-in, first come",
          },
          {
            name: "Touch-ups",
            description: "Anything that healed patchy gets touched up at no charge.",
            price: "Free",
            detail: "Within 6 months",
          },
        ],
      },
      {
        type: "about",
        title: "The artists",
        body: "Iron Lotus is a private custom studio in RiNo. Mara Quinn owns it and has tattooed since 2011, and Theo Banks and Lena Ruiz each work in a style of their own, so bring your idea to the artist whose work is closest to it.",
        people: [
          {
            name: "Mara Quinn",
            role: "Owner · blackwork & large custom",
            note: "Has tattooed since 2011, mostly blackwork and large custom pieces.",
          },
          {
            name: "Theo Banks",
            role: "Fine line & script",
            note: "Does fine line work and script lettering.",
          },
          {
            name: "Lena Ruiz",
            role: "Color realism & cover-ups",
            note: "Does color realism and covers up old tattoos.",
          },
        ],
      },
      {
        type: "faq",
        title: "Booking and deposits",
        items: [
          {
            q: "How do I hold a date?",
            a: "A $100 deposit holds your date. It comes off the price of your last session.",
          },
          {
            q: "Can I move my appointment?",
            a: "Once, with 48 hours notice, and you keep the deposit.",
          },
          {
            q: "Can I see the drawing before the day?",
            a: "No. We show it on the day of your appointment and change it with you until it's right.",
          },
          {
            q: "Do I need ID?",
            a: "Yes. You must be 18+ with a valid photo ID.",
          },
          {
            q: "What if it heals patchy?",
            a: "Touch-ups are free within 6 months.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "Mara took a half-faded name on my arm and turned it into the best thing on my body.",
            author: "Chris D.",
          },
          {
            quote: "Theo's lines are so clean my mom asked if it was a sticker.",
            author: "Priya N.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a consult",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
