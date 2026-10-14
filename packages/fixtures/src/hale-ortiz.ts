import type { SiteSpec } from "@nosweat/schema";

// Exemplo sem foto de propósito: a composição tipográfica não depende de imagem.
export const haleOrtiz: SiteSpec = {
  version: 1,
  template: "professional",
  design: {
    composition: "typographic",
    primaryAction: "book",
    density: "balanced",
    imageTreatment: "natural",
  },
  business: {
    name: "Hale & Ortiz",
    phone: "(720) 555-0148",
    email: "hello@haleortiz.example.com",
    city: "Denver",
    state: "CO",
    hours: [{ days: "Mon–Fri", time: "9 AM – 5 PM" }],
  },
  theme: {
    primary: "#1E3A5F",
    secondary: "#C2884A",
    background: "#FAFAF7",
    text: "#14181F",
    font: "refined",
  },
  sections: [
    {
      type: "hero",
      title: "Your books, kept. Your taxes, filed.",
      subtitle:
        "A two-person bookkeeping and tax practice in Denver for small businesses and the people who run them.",
      ctaLabel: "Book a Consultation",
      imageQuery: "tidy desk ledger notebook",
    },
    {
      type: "services",
      items: [
        {
          name: "Monthly bookkeeping",
          description: "Your accounts reconciled every month, with a short report you can read.",
        },
        {
          name: "Business tax returns",
          description: "Returns for sole proprietors, partnerships and small corporations.",
        },
        {
          name: "Individual tax returns",
          description: "Personal returns, including income from your own business.",
        },
        {
          name: "Quarterly estimates",
          description: "We work out what to set aside each quarter, so April has no surprises.",
        },
        {
          name: "IRS letters",
          description: "Bring us the letter. We explain what it means and help you answer it.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do I need an appointment?",
          a: "Yes. We meet by appointment, Monday to Friday, so we can give you our full attention.",
        },
        {
          q: "What should I bring to the first meeting?",
          a: "Last year's return, any tax letters you received and a list of your accounts. We'll tell you if anything else is needed.",
        },
        {
          q: "Can you help if I'm behind on bookkeeping?",
          a: "Yes. We start with the most recent months and work back, so you can see where things stand quickly.",
        },
      ],
    },
    {
      type: "contact",
      showForm: true,
      showMap: false,
    },
  ],
};
