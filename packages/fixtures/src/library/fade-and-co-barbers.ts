import type { ModelEntry } from "./types";

// Modelo de barbearia (beleza, composição tipográfica): a frase do topo é a imagem, sem foto.
// Verde-escuro de barbearia antiga + latão (latão nunca como texto). Fatos: só os do `brief`.
export const fadeAndCoBarbers: ModelEntry = {
  slug: "fade-and-co-barbers",
  category: "beauty",
  keywords: [
    "barber",
    "barbershop",
    "barber shop",
    "fade",
    "skin fade",
    "taper",
    "haircut",
    "men's haircut",
    "beard trim",
    "line up",
    "hot towel shave",
    "straight razor",
  ],
  brief: [
    "Fade & Co. Barbers is a four-chair barbershop at 2734 N Milwaukee Ave in Logan Square, Chicago, IL. I'm Darnell Hayes, I opened the shop in 2017 after ten years cutting on the South Side. Tony Russo does scissor cuts and longer hair, Kev Mitchell does beards and the straight-razor shaves.",
    "Prices: classic cut $35 (40 min), skin fade $40 (45 min), cut & beard $55 (60 min), beard trim & line-up $25 (20 min), hot towel shave $45 (45 min, straight razor, two hot towels and a cold finish), kids cut $25 (12 and under), head shave $30 (30 min).",
    "Every cut ends with a neck shave and a hot towel. Walk-ins welcome, but booking guarantees your chair. Book online at book.fadeandco.example.com. Cash and cards. Please give us 2 hours notice to cancel.",
    "Hours: Tue–Fri 10 AM – 8 PM, Sat 8 AM – 5 PM, Sun 10 AM – 3 PM. Closed Monday. Street parking on Milwaukee, the Blue Line Logan Square stop is two blocks away.",
    'Clients said: "Darnell has kept the same fade on me for five years. I don\'t even explain it anymore." (Andre W.) and "Kev\'s hot towel shave is the best twenty minutes of my month." (Sam K.)',
    "(773) 555-0142, chairs@fadeandco.example.com, instagram.example.com/fadeandco.",
    "Style: bold, old-school",
  ].join("\n"),
  spec: {
    version: 1,
    template: "beauty",
    design: {
      composition: "typographic",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Old-school barbershop: the headline does the work of a sign painter, prices read like the board on the wall.",
    },
    business: {
      name: "Fade & Co. Barbers",
      category: "Barbershop",
      phone: "(773) 555-0142",
      email: "chairs@fadeandco.example.com",
      address: "2734 N Milwaukee Ave",
      city: "Chicago",
      state: "IL",
      serviceArea: "Logan Square, Chicago",
      hours: [
        { days: "Tue–Fri", time: "10 AM – 8 PM" },
        { days: "Sat", time: "8 AM – 5 PM" },
        { days: "Sun", time: "10 AM – 3 PM" },
      ],
      highlights: ["Walk-ins welcome", "Cash and cards"],
      links: {
        booking: "https://book.fadeandco.example.com",
        instagram: "https://instagram.example.com/fadeandco",
      },
    },
    theme: {
      primary: "#1F4D3A",
      secondary: "#C9A15B",
      background: "#F3F0E8",
      text: "#171717",
      font: "bold",
    },
    sections: [
      {
        type: "hero",
        title: "Barbershop on Milwaukee Ave since 2017",
        subtitle:
          "Four chairs in Logan Square for fades, scissor cuts, beards and straight-razor shaves. Every cut ends with a neck shave and a hot towel. Walk-ins are welcome, and booking online guarantees your chair.",
        ctaLabel: "Book a chair",
      },
      {
        type: "services",
        title: "Prices",
        items: [
          {
            group: "Cuts",
            name: "Classic cut",
            description: "Clippers and scissors, with a neck shave and a hot towel at the end.",
            price: "$35",
            detail: "40 min",
          },
          {
            group: "Cuts",
            name: "Skin fade",
            description: "Faded down to the skin on the sides and back.",
            price: "$40",
            detail: "45 min",
          },
          {
            group: "Cuts",
            name: "Kids cut",
            description: "For kids 12 and under.",
            price: "$25",
          },
          {
            group: "Cuts",
            name: "Head shave",
            description: "Clipper down, then a razor finish.",
            price: "$30",
            detail: "30 min",
          },
          {
            group: "Beard & shave",
            name: "Cut & beard",
            description: "Any cut, plus a beard trim and line-up.",
            price: "$55",
            detail: "60 min",
          },
          {
            group: "Beard & shave",
            name: "Beard trim & line-up",
            description: "We trim the length and line up the cheeks and neck.",
            price: "$25",
            detail: "20 min",
          },
          {
            group: "Beard & shave",
            name: "Hot towel shave",
            description: "A straight-razor shave with two hot towels and a cold finish.",
            price: "$45",
            detail: "45 min",
          },
        ],
      },
      {
        type: "about",
        title: "About the shop",
        body: "Darnell Hayes cut hair on the South Side for ten years before he opened Fade & Co. on Milwaukee Ave in 2017. Tony Russo does scissor cuts and longer hair, and Kev Mitchell does beards and the straight-razor shaves.",
        people: [
          { name: "Darnell Hayes", role: "Owner, barber", note: "Fades and tapers." },
          { name: "Tony Russo", role: "Barber", note: "Scissor cuts and longer hair." },
          { name: "Kev Mitchell", role: "Barber", note: "Beards and straight-razor shaves." },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "Darnell has kept the same fade on me for five years. I don't even explain it anymore.",
            author: "Andre W.",
          },
          {
            quote: "Kev's hot towel shave is the best twenty minutes of my month.",
            author: "Sam K.",
          },
        ],
      },
      {
        type: "faq",
        title: "Questions",
        items: [
          {
            q: "Do you take walk-ins?",
            a: "Yes, every day we're open. Walk-ins wait for the next open barber, and booking online guarantees your chair.",
          },
          {
            q: "Can I book a specific barber?",
            a: "Yes. Pick Darnell, Tony or Kev when you book online, or ask for them by name when you call.",
          },
          {
            q: "Do you take cards?",
            a: "Yes, we take cash and cards.",
          },
          {
            q: "What if I need to cancel?",
            a: "Give us 2 hours' notice so someone else can have the chair.",
          },
          {
            q: "Where do I park?",
            a: "Street parking on Milwaukee. The Blue Line Logan Square stop is two blocks away.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a chair",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
