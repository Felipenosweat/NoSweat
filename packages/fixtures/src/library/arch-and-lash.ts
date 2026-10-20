import type { ModelEntry } from "./types";

// Modelo de cílios e sobrancelhas (beleza, composição service-led): faixa de fatos, serviços em
// linhas com preço e duração, cuidados antes/depois no FAQ. Cacau + rosado (rosado nunca como
// texto), fonte "refined". Fatos: só os do `brief`.
export const archAndLash: ModelEntry = {
  slug: "arch-and-lash",
  category: "beauty",
  keywords: [
    "lash",
    "lashes",
    "lash extensions",
    "eyelash extensions",
    "volume lashes",
    "hybrid lashes",
    "lash lift",
    "lash fill",
    "brow",
    "brows",
    "brow lamination",
    "brow wax",
    "waxing",
    "lash artist",
  ],
  brief: [
    "Arch & Lash is a lash and brow studio at 1050 Howell Mill Rd, Suite 210 in West Midtown, Atlanta, GA. I'm Keisha Monroe, a licensed esthetician in Georgia, lashing since 2018. Jada Brooks is our volume lash artist and Simone Price does brows and waxing.",
    "Prices: classic full set $140 (2 hours, one extension per natural lash), hybrid full set $175 (2 hours), volume full set $210 (2.5 hours, light hand-made fans), lash fill from $65 (60 min, every 2 to 3 weeks, needs at least 40% of your extensions still on, otherwise it's a new set), lash lift & tint $95 (60 min, lasts 6 to 8 weeks), brow lamination & shape $85 (45 min), brow wax & shape $25 (20 min), lip or chin wax $12.",
    "First time with extensions: we do a patch test at least 48 hours before your first set. A $25 deposit holds your appointment and goes toward your service. 24 hours notice to cancel or move it, or the deposit is kept.",
    "Every set is mapped to your eye shape before the first extension goes on. Come with clean lashes, no mascara, and skip caffeine before a full set so you can relax with your eyes closed. Keep lashes dry for 24 hours after.",
    "Open Tue–Fri 10 AM – 7 PM, Sat 9 AM – 4 PM. Book online at archandlash.example.com/book. Parking in the deck on Howell Mill, first hour free.",
    'Clients wrote: "Jada\'s volume set looks full without looking heavy, and it lasts to my fill every time." (Brittany J.) and "Simone fixed brows I had been overplucking since high school." (Nadia O.)',
    "(404) 555-0158, hello@archandlash.example.com, instagram.example.com/archandlash.",
    "Style: soft, polished",
  ].join("\n"),
  spec: {
    version: 1,
    template: "beauty",
    design: {
      composition: "service-led",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Lash studio: clients compare sets, prices and times before booking, so the menu and the prep rules lead.",
    },
    business: {
      name: "Arch & Lash",
      category: "Lash and brow studio",
      phone: "(404) 555-0158",
      email: "hello@archandlash.example.com",
      address: "1050 Howell Mill Rd, Suite 210",
      city: "Atlanta",
      state: "GA",
      serviceArea: "West Midtown, Atlanta",
      hours: [
        { days: "Tue–Fri", time: "10 AM – 7 PM" },
        { days: "Sat", time: "9 AM – 4 PM" },
      ],
      highlights: ["Licensed esthetician", "Patch test before first set"],
      links: {
        booking: "https://archandlash.example.com/book",
        instagram: "https://instagram.example.com/archandlash",
      },
    },
    theme: {
      primary: "#6B3A2A",
      secondary: "#E9C7B8",
      background: "#FBF6F2",
      text: "#24171A",
      font: "refined",
    },
    sections: [
      {
        type: "hero",
        title: "Lashes and brows mapped to your face, not a trend",
        subtitle:
          "Classic, hybrid and volume extensions, lash lifts and brow lamination in West Midtown. Patch test before your first set, and you'll know the price and the time before you sit down.",
        ctaLabel: "Book your set",
      },
      {
        type: "services",
        title: "Sets and prices",
        items: [
          {
            group: "Lash extensions",
            name: "Classic full set",
            description: "One extension per natural lash. Clean and defined, like mascara.",
            price: "$140",
            detail: "2 hours",
          },
          {
            group: "Lash extensions",
            name: "Hybrid full set",
            description: "A mix of classic and volume for texture and fullness.",
            price: "$175",
            detail: "2 hours",
          },
          {
            group: "Lash extensions",
            name: "Volume full set",
            description: "Light, hand-made fans for a full, soft look.",
            price: "$210",
            detail: "2.5 hours",
          },
          {
            group: "Lash extensions",
            name: "Lash fill",
            description:
              "Every 2 to 3 weeks, with at least 40% of your extensions still on. Less than that is a new set.",
            price: "from $65",
            detail: "60 min",
          },
          {
            group: "Lifts & brows",
            name: "Lash lift & tint",
            description: "Your own lashes, curled and darkened. No extensions to maintain.",
            price: "$95",
            detail: "Lasts 6 to 8 weeks",
          },
          {
            group: "Lifts & brows",
            name: "Brow lamination & shape",
            description: "Brows brushed up and set in place, then shaped.",
            price: "$85",
            detail: "45 min",
          },
          {
            group: "Waxing",
            name: "Brow wax & shape",
            description: "Shaped to your face, not a stencil.",
            price: "$25",
            detail: "20 min",
          },
          {
            group: "Waxing",
            name: "Lip or chin wax",
            description: "Quick and gentle.",
            price: "$12",
          },
        ],
      },
      {
        type: "faq",
        title: "Prep and aftercare",
        items: [
          {
            q: "Is this my first time with extensions?",
            a: "Then we'll do a patch test at least 48 hours before your first set.",
          },
          {
            q: "How should I come in?",
            a: "With clean lashes and no mascara. Skip the caffeine before a full set, so you can relax with your eyes closed for two hours.",
          },
          {
            q: "How do I take care of new lashes?",
            a: "Keep them dry for 24 hours after your appointment.",
          },
          {
            q: "When do I need a fill?",
            a: "Every 2 to 3 weeks. A fill needs at least 40% of your extensions still on; otherwise we book a new set.",
          },
          {
            q: "Do you take a deposit?",
            a: "Yes, $25 holds your appointment and goes toward your service. Cancel or move it with 24 hours' notice, or the deposit is kept.",
          },
          {
            q: "Where do I park?",
            a: "In the deck on Howell Mill. The first hour is free.",
          },
        ],
      },
      {
        type: "about",
        title: "Your artists",
        body: "Keisha Monroe is a licensed esthetician in Georgia and has been lashing since 2018. At Arch & Lash every set is mapped to your eye shape before the first extension goes on, and every brow is shaped to your face.",
        people: [
          {
            name: "Keisha Monroe",
            role: "Owner, licensed esthetician",
            note: "Licensed in Georgia, lashing since 2018.",
          },
          { name: "Jada Brooks", role: "Lash artist", note: "Volume sets." },
          { name: "Simone Price", role: "Brow artist", note: "Brows and waxing." },
        ],
      },
      {
        type: "testimonials",
        title: "From our clients",
        items: [
          {
            quote:
              "Jada's volume set looks full without looking heavy, and it lasts to my fill every time.",
            author: "Brittany J.",
          },
          {
            quote: "Simone fixed brows I had been overplucking since high school.",
            author: "Nadia O.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book your appointment",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
