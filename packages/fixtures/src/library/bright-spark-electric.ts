import type { ModelEntry } from "./types";

// Modelo de eletricista (serviços para casa) na composição tipográfica: a frase do topo é a
// imagem; a foto (cena, não "nosso trabalho") fica em faixa larga embaixo do bloco preto, e o
// amarelo da grade de obra repete o fio amarelo do tema. Sem galeria: não havia fotos de serviço
// residencial boas o bastante. Todos os fatos do site estão no brief, nas palavras do "dono"
// (regra 8). Foto: Flickr, CC BY 2.0, crédito em `credit`.
export const brightSparkElectric: ModelEntry = {
  slug: "bright-spark-electric",
  category: "home-services",
  keywords: [
    "electrician",
    "electrical",
    "electric",
    "wiring",
    "rewiring",
    "panel upgrade",
    "breaker",
    "ev charger",
    "outlet",
    "lighting",
    "ceiling fan",
    "generator",
  ],
  brief: [
    "Bright Spark Electric, a residential electrician in Phoenix, AZ. I'm Marcus Bell, master electrician; I've been wiring houses in the Valley since 2006 and started Bright Spark in 2014. My wife Tasha runs the office and handles the city permits. When you call, you talk to one of us, not a call center.",
    "Licensed with the Arizona ROC, bonded and insured. You get a written quote before we start, and we pull the permit when the job needs one.",
    "Panel upgrades to 200 amps from $2,400, Level 2 EV charger installs from $650 (Tesla, ChargePoint, any brand you bought), whole-home rewiring for older houses quoted after a walkthrough, lighting, recessed cans and ceiling fans from $175, and troubleshooting for breakers that keep tripping or outlets that went dead. The service call is $95.",
    "For a panel upgrade I look at the panel and meter first and write the quote. On the day the power is off for part of it, and before I leave I walk you through every breaker. Tasha schedules the city inspection.",
    "Hours Mon–Fri 7 AM – 5 PM, Sat 8 AM – 12 PM. We cover Phoenix, Tempe, Scottsdale, Mesa, Chandler and Glendale.",
    'Customers said we could quote them: Rachel K. in Tempe, "Marcus upgraded our 1970s panel in one day and walked me through every breaker before he left." And Omar H. in Chandler, "The EV charger quote was $650 and the bill was $650. Tasha even scheduled the inspection for us."',
    "Phone (602) 555-0137, office@brightspark.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "home-services",
    design: {
      composition: "typographic",
      primaryAction: "call",
      density: "compact",
      imageTreatment: "natural",
    },
    business: {
      name: "Bright Spark Electric",
      category: "Electrician",
      phone: "(602) 555-0137",
      email: "office@brightspark.example.com",
      city: "Phoenix",
      state: "AZ",
      serviceArea: "Phoenix, Tempe, Scottsdale, Mesa, Chandler and Glendale",
      hours: [
        { days: "Mon–Fri", time: "7 AM – 5 PM" },
        { days: "Sat", time: "8 AM – 12 PM" },
      ],
      highlights: ["Arizona ROC licensed", "Bonded & insured", "Written quote first"],
    },
    theme: {
      // Bloco preto do topo com fio amarelo de alerta: o amarelo nunca vira texto.
      primary: "#17181C",
      secondary: "#F2B705",
      background: "#F2F0E8",
      text: "#17181C",
      font: "technical",
    },
    sections: [
      {
        type: "hero",
        title: "Residential electrician in Phoenix, Arizona",
        subtitle:
          "Marcus Bell has been wiring houses in the Valley since 2006. We upgrade panels, install EV chargers and rewire older homes, and you get a written quote before we start.",
        ctaLabel: "Call for a quote",
        image: {
          url: "/photos/models/bright-spark-electric-2.webp",
          alt: "An electrician in a hard hat and safety vest wiring a junction box from a lift platform",
          source: "upload",
          kind: "scene",
          credit: {
            name: "garryknight",
            url: "https://www.flickr.com/photos/8176740@N05/15657882247",
          },
          width: 1024,
          height: 683,
          // A faixa 3:1 corta muito na altura: alto o bastante para manter o capacete e as mãos.
          focus: "60% 15%",
        },
      },
      {
        type: "services",
        title: "Electrical services",
        items: [
          {
            name: "Panel upgrades",
            description:
              "We replace old or undersized panels with 200-amp service and pull the permit when the job needs one.",
            detail: "200 amps",
            price: "from $2,400",
          },
          {
            name: "EV charger installs",
            description:
              "Level 2 chargers from Tesla, ChargePoint or whatever brand you already bought.",
            detail: "Level 2",
            price: "from $650",
          },
          {
            name: "Whole-home rewiring",
            description:
              "New wiring for older houses, quoted after Marcus walks through the house with you.",
            detail: "Quoted after a walkthrough",
          },
          {
            name: "Lighting and ceiling fans",
            description: "Recessed cans, light fixtures and ceiling fans.",
            price: "from $175",
          },
          {
            name: "Troubleshooting",
            description: "For breakers that keep tripping and outlets that went dead.",
            detail: "Service call",
            price: "$95",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "Marcus upgraded our 1970s panel in one day and walked me through every breaker before he left.",
            author: "Rachel K., Tempe",
          },
          {
            quote:
              "The EV charger quote was $650 and the bill was $650. Tasha even scheduled the inspection for us.",
            author: "Omar H., Chandler",
          },
        ],
      },
      {
        type: "about",
        title: "About us",
        body: "Marcus Bell has been wiring houses in the Valley since 2006 and started Bright Spark in 2014. His wife Tasha runs the office and handles the city permits. When you call, you talk to one of them.",
        people: [
          {
            name: "Marcus Bell",
            role: "Owner, master electrician",
            note: "Wiring Valley homes since 2006.",
          },
          { name: "Tasha Bell", role: "Office and permits" },
        ],
      },
      {
        type: "faq",
        items: [
          {
            q: "Do I get a price before you start?",
            a: "Yes. You get a written quote before any work begins.",
          },
          {
            q: "What does a service call cost?",
            a: "The service call is $95, and you get a written quote before any repair.",
          },
          {
            q: "How does a panel upgrade day go?",
            a: "Marcus looks at your panel and meter first and gives you a written quote. On the day, the power is off for part of it, and before he leaves he walks you through every breaker. Tasha schedules the city inspection.",
          },
          {
            q: "Do you handle permits?",
            a: "Yes. When the job needs a permit, we pull it and Tasha schedules the inspection.",
          },
          {
            q: "Can you install the EV charger I already bought?",
            a: "Yes. We install Level 2 chargers from Tesla, ChargePoint or any other brand, starting at $650.",
          },
          {
            q: "Which cities do you cover?",
            a: "Phoenix, Tempe, Scottsdale, Mesa, Chandler and Glendale.",
          },
        ],
      },
      {
        type: "contact",
        title: "Contact us",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
