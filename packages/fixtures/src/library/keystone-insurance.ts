import type { ModelEntry } from "./types";

// Modelo profissional "service-led": agência de seguros independente. Telefone sempre à vista,
// faixa de fatos, coberturas em linhas e a lista de bairros/cidades atendidos. Seguro não tem
// preço de vitrine: as linhas mostram o prazo da cotação, nunca um valor inventado. Sem foto.
export const keystoneInsurance: ModelEntry = {
  slug: "keystone-insurance",
  category: "professional",
  keywords: [
    "insurance",
    "insurance agency",
    "insurance agent",
    "independent agent",
    "home insurance",
    "auto insurance",
    "car insurance",
    "business insurance",
    "life insurance",
    "umbrella",
    "workers comp",
    "insurance quote",
  ],
  brief: [
    "Keystone Insurance Group is an independent insurance agency at 4711 Liberty Ave in Bloomfield, Pittsburgh, PA. Frank Kowalski started it in 1998 and is a licensed Pennsylvania agent; Teresa Nguyen, CIC, handles our small business clients and Mike Kowalski handles home and auto.",
    "Because we're independent we quote the same coverage with six insurance companies: Erie, Travelers, Progressive, Safeco, Nationwide and Westfield. Quotes are free and most home and auto quotes come back in one business day; business quotes can take a little longer. We show you the quotes side by side, including the bundled price next to separate policies.",
    "We write home and condo, renters, auto (teen drivers too), home and auto bundles, umbrella policies, small business coverage (business owner's policies, general liability, workers' comp, commercial auto) and term life. We review every policy at renewal and call you if there's a better price. When you have a claim you call us first, not an 800 number, and we help you file it and stay on it with the insurance company. When you call, you get one of the three of us.",
    "We serve Pittsburgh, Mt. Lebanon, Bethel Park, Cranberry Township, Monroeville and Sewickley. Office hours Mon–Fri 8:30 AM – 5:30 PM, Sat 9 AM – 12 PM.",
    'Clients said: "Mike moved our home and both cars to one company and walked me through every line of the new policy." (Angela D., Mt. Lebanon) and "When a pipe burst at the shop, Teresa had the adjuster out the next morning." (Sam P., Bloomfield)',
    "(412) 555-0139, quotes@keystoneins.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "professional",
    design: {
      composition: "service-led",
      primaryAction: "quote",
      density: "compact",
      imageTreatment: "natural",
      rationale:
        "Local insurance agency: phone and quote up front, coverage lines in rows, the towns served in big type.",
    },
    business: {
      name: "Keystone Insurance Group",
      category: "Independent insurance agency",
      phone: "(412) 555-0139",
      email: "quotes@keystoneins.example.com",
      address: "4711 Liberty Ave",
      city: "Pittsburgh",
      state: "PA",
      serviceArea:
        "Pittsburgh, Mt. Lebanon, Bethel Park, Cranberry Township, Monroeville and Sewickley",
      hours: [
        { days: "Mon–Fri", time: "8:30 AM – 5:30 PM" },
        { days: "Sat", time: "9 AM – 12 PM" },
      ],
      highlights: ["Independent since 1998", "Six companies, one quote", "Free quotes"],
    },
    theme: {
      primary: "#1C5B45",
      secondary: "#D9A62E",
      background: "#FBFAF6",
      text: "#191C1F",
      font: "modern",
    },
    sections: [
      {
        type: "hero",
        title: "Independent insurance agency in Bloomfield",
        subtitle:
          "Frank Kowalski started Keystone on Liberty Ave in 1998. We quote your home, car or business with six insurance companies and show you the quotes side by side.",
        ctaLabel: "Get a free quote",
        imageQuery: "pittsburgh row houses street",
      },
      {
        type: "services",
        title: "What we cover",
        items: [
          {
            name: "Home and condo",
            description:
              "Homeowners and condo policies, quoted with all six companies so you can compare them side by side.",
            detail: "Most quotes in one business day",
          },
          {
            name: "Auto",
            description:
              "Auto policies, including teen drivers. If you also insure your home with us, we show the bundled price next to separate policies.",
            detail: "Most quotes in one business day",
          },
          {
            name: "Renters",
            description: "Your belongings and liability, for an apartment or a rented house.",
            detail: "Free quote",
          },
          {
            name: "Small business",
            description:
              "Business owner's policies, general liability, workers' comp and commercial auto, handled by Teresa Nguyen, CIC.",
            detail: "Free quote",
          },
          {
            name: "Umbrella",
            description: "Extra liability coverage on top of your home and auto policies.",
            detail: "Free quote",
          },
          {
            name: "Term life",
            description: "Term life policies for individuals and families.",
            detail: "Free quote",
          },
        ],
      },
      {
        type: "faq",
        title: "Questions",
        items: [
          {
            q: "What does independent mean?",
            a: "We aren't tied to one insurance company. We quote the same coverage with Erie, Travelers, Progressive, Safeco, Nationwide and Westfield, and you choose the policy.",
          },
          {
            q: "How long does a quote take?",
            a: "Quotes are free, and most home and auto quotes come back in one business day. Business coverage can take a little longer.",
          },
          {
            q: "What happens at renewal?",
            a: "We review every policy at renewal and call you if there's a better price.",
          },
          {
            q: "Who do I call when I have a claim?",
            a: "Call us first. We help you file the claim and stay on it with the insurance company.",
          },
          {
            q: "Can I come by the office?",
            a: "Yes, we're at 4711 Liberty Ave in Bloomfield, Mon–Fri 8:30 AM – 5:30 PM and Sat 9 AM – 12 PM.",
          },
        ],
      },
      {
        type: "about",
        title: "About the agency",
        body: "Frank Kowalski started Keystone in 1998. We're a small office on Liberty Ave, and when you call, one of the three of us answers.",
        people: [
          {
            name: "Frank Kowalski",
            role: "Founder, licensed Pennsylvania agent",
            note: "Started the agency in 1998.",
          },
          {
            name: "Teresa Nguyen, CIC",
            role: "Small business clients",
            note: "Business owner's policies, liability, workers' comp and commercial auto.",
          },
          {
            name: "Mike Kowalski",
            role: "Home and auto",
            note: "Home, condo, renters and auto policies.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "Mike moved our home and both cars to one company and walked me through every line of the new policy.",
            author: "Angela D., Mt. Lebanon",
          },
          {
            quote: "When a pipe burst at the shop, Teresa had the adjuster out the next morning.",
            author: "Sam P., Bloomfield",
          },
        ],
      },
      {
        type: "contact",
        title: "Get a free quote",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
