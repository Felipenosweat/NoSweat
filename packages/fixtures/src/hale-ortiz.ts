import type { SiteSpec } from "@nosweat/schema";

// Modelo profissional (ver docs/design/model-sites.md). Fatos: briefs.ts.
// Sem foto de propósito: a composição tipográfica não depende de imagem.
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
    category: "Bookkeeping and tax practice",
    phone: "(720) 555-0148",
    email: "hello@haleortiz.example.com",
    address: "1550 Wynkoop St, Suite 300",
    city: "Denver",
    state: "CO",
    hours: [{ days: "Mon–Fri", time: "9 AM – 5 PM" }],
    links: { booking: "https://haleortiz.example.com/book" },
  },
  theme: {
    primary: "#1E3A5F",
    secondary: "#B08D57",
    background: "#FAFAF7",
    text: "#14181F",
    font: "refined",
  },
  sections: [
    {
      type: "hero",
      title: "Bookkeeping and tax practice in Denver",
      subtitle:
        "Dana Hale, CPA, and Luis Ortiz, enrolled agent, keep the books and prepare the returns for small businesses and their owners, by appointment on Wynkoop Street.",
      ctaLabel: "Book a consultation",
      imageQuery: "tidy desk ledger notebook",
    },
    {
      type: "services",
      items: [
        {
          name: "Monthly bookkeeping",
          description: "We reconcile your accounts and keep your books up to date each month.",
          price: "from $350",
          detail: "Monthly",
        },
        {
          name: "Business tax returns",
          description: "Returns for sole proprietors, partnerships and small corporations.",
          price: "from $900",
          detail: "Yearly",
        },
        {
          name: "Individual tax returns",
          description: "Personal returns, including income from your own business.",
          price: "from $300",
          detail: "Yearly",
        },
        {
          name: "Quarterly estimates",
          description: "We calculate your estimated tax payment for each quarter.",
          price: "$150",
          detail: "Each quarter",
        },
        {
          name: "IRS letters",
          description: "We explain what the IRS letter means and help you write the reply.",
          detail: "As needed",
        },
      ],
    },
    {
      type: "about",
      body: "Hale & Ortiz is a two-person practice, and you work with one of us from the first meeting to the filed return.",
      people: [
        {
          name: "Dana Hale",
          role: "CPA, licensed in Colorado",
          note: "Business returns and monthly bookkeeping.",
        },
        {
          name: "Luis Ortiz",
          role: "Enrolled agent",
          note: "Individual returns and IRS letters.",
        },
      ],
    },
    {
      type: "testimonials",
      items: [
        {
          quote:
            "Dana caught a payroll mistake in our first month that would have cost us more than a year of her fees.",
          author: "Priya S., small business owner",
        },
        {
          quote: "Luis turned a scary IRS letter into a two-page reply and it was over.",
          author: "Tom W.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do I need an appointment?",
          a: "Yes. We meet by appointment, Monday through Friday from 9 to 5, and you can book a consultation online.",
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
