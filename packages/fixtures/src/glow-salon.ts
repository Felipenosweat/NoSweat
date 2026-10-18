import type { SiteSpec } from "@nosweat/schema";

// Modelo de beleza (ver docs/design/model-sites.md). Fatos: briefs.ts.
export const glowSalon: SiteSpec = {
  version: 1,
  template: "beauty",
  design: {
    composition: "editorial",
    primaryAction: "book",
    density: "airy",
    imageTreatment: "natural",
  },
  business: {
    name: "Glow Salon",
    category: "Hair salon",
    phone: "(305) 555-0187",
    email: "hello@glowsalon.example.com",
    address: "2520 NW 2nd Ave",
    city: "Miami",
    state: "FL",
    serviceArea: "Wynwood, Miami",
    hours: [
      { days: "Tue–Sat", time: "10 AM – 7 PM" },
      { days: "Sun", time: "11 AM – 5 PM" },
    ],
    links: { booking: "https://book.glowsalon.example.com" },
  },
  theme: {
    primary: "#8C2F4B",
    secondary: "#C8A27A",
    background: "#FBF7F3",
    text: "#2B1E1A",
    font: "editorial",
  },
  sections: [
    {
      type: "hero",
      title: "Color and cuts, planned with you first",
      subtitle:
        "A three-chair Wynwood studio for balayage, precision cuts and keratin smoothing. Book online; we take walk-ins when a chair is open.",
      ctaLabel: "Book an appointment",
      imageQuery: "modern hair salon interior",
      image: {
        url: "/photos/example-salon.webp",
        alt: "A bright hair salon with styling chairs and mirrors",
        source: "unsplash",
        kind: "scene",
        credit: { name: "Benyamin Bohlouli", url: "https://unsplash.com/photos/LZLdLR7vuHg" },
        width: 2400,
        height: 1601,
      },
    },
    {
      type: "services",
      items: [
        {
          group: "Cut & style",
          name: "Precision cut and blowout",
          description: "Shaped for how your hair grows, finished with a blowout.",
          price: "from $85",
          detail: "60 min",
        },
        {
          group: "Cut & style",
          name: "Blowout",
          description: "Wash and a smooth or full-volume finish.",
          price: "$55",
          detail: "45 min",
        },
        {
          group: "Color",
          name: "Balayage",
          description: "Hand-painted highlights, planned at the chair before we start.",
          price: "from $220",
          detail: "About 3 hours",
        },
        {
          group: "Color",
          name: "Single-process color",
          description: "Root touch-up or all-over color.",
          price: "from $110",
          detail: "90 min",
        },
        {
          group: "Treatments",
          name: "Keratin smoothing",
          description: "Calms humidity frizz and cuts blow-dry time.",
          price: "from $250",
          detail: "Lasts up to 12 weeks",
        },
        {
          group: "Treatments",
          name: "Scalp treatment",
          description: "A deep cleanse and hydration for the scalp and roots.",
          price: "$45",
          detail: "30 min",
        },
        {
          group: "Events",
          name: "Bridal and event hair and makeup",
          description: "For weddings, quinceañeras and big nights. Ask us for a date.",
          detail: "By request",
        },
      ],
    },
    {
      type: "about",
      body: "Camila Reyes opened Glow in 2019: three chairs and a wash station on NW 2nd Ave. Every appointment starts with a conversation at the chair before anything gets cut or colored.",
      people: [
        { name: "Camila Reyes", role: "Owner, colorist", note: "Balayage and lived-in color." },
        { name: "Jordan Lee", role: "Stylist", note: "Precision cuts and curly hair." },
        { name: "Aisha Grant", role: "Stylist", note: "Keratin, blowouts and event styling." },
      ],
    },
    {
      type: "testimonials",
      items: [
        {
          quote:
            "Camila asked more questions than any colorist I have had, and my balayage grew out beautifully.",
          author: "Natalie R.",
        },
        {
          quote: "Jordan finally gave my curls a shape that works on day three.",
          author: "Marcus T.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you accept walk-ins?",
          a: "When a chair is open, yes. We recommend booking ahead, especially on weekends.",
        },
        {
          q: "How long does a color appointment take?",
          a: "Single-process color takes about 90 minutes and balayage about 3 hours. You'll see the time when you book.",
        },
        {
          q: "What is your cancellation policy?",
          a: "Please give us at least 24 hours' notice so we can offer your time to another guest.",
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
