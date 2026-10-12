import type { SiteSpec } from "@nosweat/schema";

export const glowSalon: SiteSpec = {
  version: 1,
  template: "beauty",
  business: {
    name: "Glow Salon",
    phone: "(305) 555-0187",
    email: "hello@glowsalon.example.com",
    city: "Miami",
    state: "FL",
  },
  theme: {
    primary: "#BE185D",
    secondary: "#D4A373",
    background: "#FFF8F6",
    text: "#2B1B22",
    font: "classic",
  },
  sections: [
    {
      type: "hero",
      title: "Hair That Turns Heads in Miami",
      subtitle:
        "Color, cuts, and treatments by stylists who listen. Step into our Wynwood studio and leave glowing.",
      ctaLabel: "Book Your Appointment",
    },
    {
      type: "services",
      items: [
        {
          name: "Precision Cuts",
          description: "Tailored cuts for every hair type, finished with a signature blowout.",
        },
        {
          name: "Balayage & Color",
          description: "Hand-painted highlights and rich, lasting color made for the Florida sun.",
        },
        {
          name: "Keratin Smoothing",
          description: "Say goodbye to humidity frizz with treatments that last up to 12 weeks.",
        },
        {
          name: "Bridal & Events",
          description: "Hair and makeup for weddings, quinceañeras, and every big night out.",
        },
        {
          name: "Scalp Treatments",
          description:
            "Relaxing deep-cleanse and hydration rituals for healthy hair from the root.",
        },
      ],
    },
    {
      type: "testimonials",
      items: [
        {
          quote:
            "Best balayage I've ever had. Camila understood exactly what I wanted and the color still looks amazing two months later.",
          author: "Andrea M.",
        },
        {
          quote:
            "The keratin treatment changed my life. I can finally walk outside in July without my hair exploding.",
          author: "Jasmine L.",
        },
        {
          quote:
            "They did hair for my whole bridal party and everyone looked stunning. Calm, on time, and so talented.",
          author: "Natalie G.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you accept walk-ins?",
          a: "We welcome walk-ins when we have openings, but we recommend booking ahead, especially on weekends.",
        },
        {
          q: "How long does a color appointment take?",
          a: "Most color services take 2 to 3 hours. We'll give you a time estimate when you book.",
        },
        {
          q: "What is your cancellation policy?",
          a: "Please give us at least 24 hours' notice so we can offer your spot to another guest.",
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
