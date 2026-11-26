import type { SiteSpec } from "@nosweat/schema";

// Segundo modelo de serviços para casa, na composição modular (ver docs/design/model-sites.md).
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
    category: "House cleaning",
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
    primary: "#0F5E5A",
    secondary: "#B45309",
    background: "#F3F9F8",
    text: "#0F172A",
    muted: "#4B5F66",
    font: "modern",
  },
  sections: [
    {
      type: "hero",
      title: "House cleaning in Worcester, Massachusetts",
      subtitle:
        "We clean homes in Worcester and nearby towns every week, every two weeks or just once. Tell us the size of your home and we'll send a price before the first visit.",
      ctaLabel: "Get a cleaning quote",
      imageQuery: "cleaning crew bright kitchen",
      image: {
        url: "/photos/crew.webp",
        alt: "A cleaning crew mopping and wiping a bright kitchen",
        source: "pexels",
        kind: "scene",
        credit: { name: "Tima Miroshnichenko", url: "https://www.pexels.com/photo/6197108/" },
        width: 2400,
        height: 1600,
        focus: "50% 45%",
      },
    },
    {
      type: "services",
      items: [
        {
          name: "Recurring cleaning",
          description: "Kitchens, bathrooms, floors and dusting, done by the same team each visit.",
          detail: "Weekly or every two weeks",
        },
        {
          name: "Deep cleaning",
          description:
            "A longer clean that gets the baseboards, the grout and the inside of the appliances.",
          detail: "One time",
        },
        {
          name: "Move-in / move-out",
          description:
            "We clean the empty house or apartment before you hand back the keys or move in.",
          detail: "One time",
        },
        {
          name: "Post-renovation",
          description: "Cleanup of the dust and debris left behind when the contractors finish.",
          detail: "One time",
        },
      ],
    },
    {
      type: "about",
      body: "Recurring clients get the same two-person team every visit, and we bring our own supplies. You get the price before the first visit, set by the size of your home.",
    },
    {
      type: "faq",
      items: [
        {
          q: "When do you clean?",
          a: "Monday to Friday from 8 AM to 6 PM, and Saturday from 9 AM to 2 PM.",
        },
        {
          q: "Do you bring your own supplies?",
          a: "Yes, we bring all of our own supplies.",
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
      showMap: false,
    },
  ],
};
