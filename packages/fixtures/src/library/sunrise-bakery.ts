import type { ModelEntry } from "./types";

// Modelo de restaurante: padaria com encomendas e bolos sob medida (composição service-led:
// horário, endereço e encomenda sempre à vista). Todo fato do site está no `brief` (regra 8).
export const sunriseBakery: ModelEntry = {
  slug: "sunrise-bakery",
  category: "restaurant",
  keywords: [
    "bakery",
    "bakeshop",
    "sourdough",
    "bread",
    "pastries",
    "croissant",
    "custom cakes",
    "birthday cake",
    "wedding cake",
    "preorder",
    "baker",
  ],
  brief: [
    "Sunrise Bakery at 2415 J St in Midtown Sacramento, CA. I'm Mai Tran, the baker. I started selling sourdough at the Midtown farmers market in 2016 and opened the shop in 2020. Elena Ruiz is our cake decorator and does every custom cake.",
    "Our sourdough ferments for 48 hours, and the first loaves come out at 7 AM. Country sourdough $9 every day, seeded rye $10 on Fri–Sun. Pastries: butter croissant $4.50, morning bun with orange zest and cinnamon sugar $5, kouign-amann $5.50 on weekends.",
    "Custom cakes from $55 for a 6-inch that serves 8–10, order 5 days ahead. Tiered wedding cakes from $350, with a tasting by appointment. Preorders: the Saturday bread box is $28 for two loaves and four pastries, order by Thursday noon at order.sunrisebakery.example.com.",
    "Open Wed–Fri 7 AM – 2 PM, Sat–Sun 7 AM – 1 PM, closed Mon–Tue. Bread usually sells out by noon on weekends. Our kitchen uses nuts, wheat, dairy and eggs, so we can't promise anything is allergen-free.",
    'Customers wrote: "Mai\'s sourdough ruined grocery-store bread for my whole family." (Kara L.) and "Elena matched the cake to my daughter\'s drawing. She cried. I cried." (Jamal W.)',
    "(916) 555-0152, hello@sunrisebakery.example.com.",
    "Style: warm, refined",
  ].join("\n"),
  spec: {
    version: 1,
    template: "restaurant",
    design: {
      composition: "service-led",
      primaryAction: "visit",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Bakery that runs on preorders and sells out: hours and the preorder button always in view, raspberry for actions, a honey rule as accent.",
    },
    business: {
      name: "Sunrise Bakery",
      category: "Sourdough bakery & custom cakes",
      phone: "(916) 555-0152",
      email: "hello@sunrisebakery.example.com",
      address: "2415 J St",
      city: "Sacramento",
      state: "CA",
      serviceArea: "Midtown Sacramento",
      hours: [
        { days: "Wed–Fri", time: "7 AM – 2 PM" },
        { days: "Sat–Sun", time: "7 AM – 1 PM" },
        { days: "Mon–Tue", time: "Closed" },
      ],
      highlights: ["48-hour sourdough", "Preorder by Thursday noon"],
      links: {
        order: "https://order.sunrisebakery.example.com",
      },
    },
    theme: {
      primary: "#9C3B4E",
      secondary: "#E9B34A",
      background: "#FFF9F3",
      text: "#2D2420",
      font: "luxe",
    },
    sections: [
      {
        type: "hero",
        title: "Sourdough bakery on J St in Midtown",
        subtitle:
          "Our sourdough ferments for 48 hours and the first loaves are out at 7 AM. We also make pastries and custom cakes. Weekend bread usually sells out by noon, so come early or preorder.",
        ctaLabel: "Preorder for pickup",
        imageQuery: "butter croissant close up",
        image: {
          url: "/photos/models/sunrise-bakery-12.webp",
          alt: "Close-up of golden, flaky butter croissants with their laminated layers showing",
          source: "upload",
          kind: "scene",
          credit: {
            name: "Blarvar",
            url: "https://www.flickr.com/photos/46583370@N04/4599562280",
          },
          width: 1024,
          height: 632,
          focus: "40% 50%",
        },
      },
      {
        type: "services",
        title: "Menu",
        items: [
          {
            group: "Bread",
            name: "Country sourdough",
            description: "Our everyday loaf, fermented for 48 hours.",
            price: "$9",
            detail: "Every day from 7 AM",
          },
          {
            group: "Bread",
            name: "Seeded rye",
            description: "A seeded rye loaf, baked for the weekend.",
            price: "$10",
            detail: "Fri–Sun",
          },
          {
            group: "Pastry",
            name: "Butter croissant",
            description: "A plain butter croissant.",
            price: "$4.50",
          },
          {
            group: "Pastry",
            name: "Morning bun",
            description: "Rolled with orange zest and cinnamon sugar.",
            price: "$5",
          },
          {
            group: "Pastry",
            name: "Kouign-amann",
            description: "A Breton pastry we make on weekends.",
            price: "$5.50",
            detail: "Sat–Sun",
          },
          {
            group: "Cakes & preorders",
            name: "Custom cake",
            description: "Elena designs and decorates every one. A 6-inch cake serves 8–10.",
            price: "from $55",
            detail: "Order 5 days ahead",
          },
          {
            group: "Cakes & preorders",
            name: "Tiered wedding cake",
            description: "Tiered cakes, with a tasting by appointment.",
            price: "from $350",
            detail: "Tasting by appointment",
          },
          {
            group: "Cakes & preorders",
            name: "Saturday bread box",
            description: "Two loaves and four pastries, picked up on Saturday.",
            price: "$28",
            detail: "Order by Thursday noon",
          },
        ],
      },
      {
        type: "about",
        title: "About us",
        body: "Mai Tran started selling sourdough at the Midtown farmers market in 2016 and opened the shop on J St in 2020. The bread still ferments for 48 hours, and the first loaves come out at 7 AM. Elena Ruiz is our cake decorator and does every custom cake.",
        people: [
          {
            name: "Mai Tran",
            role: "Owner & baker",
            note: "Has baked our sourdough since the farmers market days in 2016.",
          },
          {
            name: "Elena Ruiz",
            role: "Cake decorator",
            note: "Designs and decorates every custom and wedding cake.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote: "Mai's sourdough ruined grocery-store bread for my whole family.",
            author: "Kara L.",
          },
          {
            quote: "Elena matched the cake to my daughter's drawing, and we both cried.",
            author: "Jamal W.",
          },
        ],
      },
      {
        type: "faq",
        title: "Questions",
        items: [
          {
            q: "When does the bread sell out?",
            a: "Usually by noon on weekends. If you want to be sure, preorder the Saturday bread box.",
          },
          {
            q: "How do preorders work?",
            a: "Order online by Thursday noon and pick up your box on Saturday at the counter.",
          },
          {
            q: "How far ahead should I order a cake?",
            a: "5 days for a custom cake. For wedding cakes, book a tasting with Elena first.",
          },
          {
            q: "Do you have allergen-free options?",
            a: "Our kitchen uses nuts, wheat, dairy and eggs, so we can't promise anything is allergen-free.",
          },
          {
            q: "Are you open Monday?",
            a: "We're closed Monday and Tuesday. Open Wed–Fri 7 AM – 2 PM and Sat–Sun 7 AM – 1 PM.",
          },
        ],
      },
      {
        type: "contact",
        title: "Order a cake",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
