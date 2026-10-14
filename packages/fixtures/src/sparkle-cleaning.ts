import type { SiteSpec } from "@nosweat/schema";

export const sparkleCleaning: SiteSpec = {
  version: 1,
  template: "home-services",
  design: {
    composition: "modular",
    primaryAction: "quote",
    density: "balanced",
    imageTreatment: "natural",
  },
  business: {
    name: "Sparkle & Co. Cleaning",
    phone: "(508) 555-0142",
    email: "hello@sparkleco.example.com",
    city: "Worcester",
    state: "MA",
    serviceArea: "Worcester and nearby towns",
    hours: [
      { days: "Mon–Fri", time: "8 AM – 6 PM" },
      { days: "Sat", time: "9 AM – 2 PM" },
    ],
  },
  theme: {
    primary: "#0F766E",
    secondary: "#F59E0B",
    background: "#FFFFFF",
    text: "#0F172A",
    font: "fresh",
  },
  sections: [
    {
      type: "hero",
      title: "A Spotless Home Without Lifting a Finger",
      subtitle:
        "Weekly, biweekly and one-time house cleaning across Worcester County. Tell us about your home and we'll send a clear price before we start.",
      ctaLabel: "Get a Cleaning Quote",
      imageQuery: "cleaning crew bright kitchen",
      image: {
        url: "/photos/cleaner.webp",
        alt: "A person organizing a kitchen cabinet",
        source: "unsplash",
        kind: "scene",
        credit: {
          name: "American Cleaning Institute",
          url: "https://unsplash.com/photos/j4rDt1pF6ug",
        },
        width: 2400,
        height: 1601,
      },
    },
    {
      type: "services",
      items: [
        {
          name: "Recurring Cleaning",
          description:
            "Weekly or biweekly visits that keep kitchens, bathrooms and floors ready for company.",
        },
        {
          name: "Deep Cleaning",
          description:
            "Baseboards, inside appliances, grout and the corners a regular clean doesn't reach.",
        },
        {
          name: "Move-In / Move-Out",
          description:
            "Empty-home cleaning so you can hand back the keys or move in to a fresh start.",
        },
        {
          name: "Post-Renovation",
          description: "Dust and debris removal after contractors finish, top to bottom.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do I need to be home during the cleaning?",
          a: "No. Many clients leave a key or door code. We'll confirm the details when you book.",
        },
        {
          q: "Do you bring your own supplies?",
          a: "Yes, we bring everything. If you prefer specific products, just let us know.",
        },
        {
          q: "How is the price set?",
          a: "By home size and the type of cleaning. You get the price before the first visit.",
        },
      ],
    },
    {
      type: "contact",
      showForm: true,
      showMap: true,
    },
  ],
};
