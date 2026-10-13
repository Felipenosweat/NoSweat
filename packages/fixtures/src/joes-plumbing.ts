import type { SiteSpec } from "@nosweat/schema";

export const joesPlumbing: SiteSpec = {
  version: 1,
  template: "home-services",
  business: {
    name: "Joe's Plumbing",
    phone: "(512) 555-0142",
    email: "service@joesplumbing.example.com",
    city: "Austin",
    state: "TX",
  },
  theme: {
    primary: "#1D4ED8",
    secondary: "#F97316",
    background: "#FFFFFF",
    text: "#0F172A",
    font: "modern",
  },
  sections: [
    {
      type: "hero",
      title: "Austin's Trusted Plumbers, On Time Every Time",
      subtitle:
        "From leaky faucets to full repipes, Joe's Plumbing has kept Central Texas homes running for over 20 years. Upfront pricing, same-day service, and work we stand behind.",
      ctaLabel: "Get a Free Estimate",
    },
    {
      type: "services",
      items: [
        {
          name: "Emergency Repairs",
          description:
            "Burst pipe at 2 a.m.? Our licensed plumbers are on call 24/7 across the Austin metro.",
        },
        {
          name: "Water Heaters",
          description:
            "Repair and installation of tank and tankless water heaters, usually same day.",
        },
        {
          name: "Drain Cleaning",
          description:
            "Hydro-jetting and camera inspections to clear stubborn clogs and keep them gone.",
        },
        {
          name: "Leak Detection",
          description:
            "Non-invasive slab leak detection that finds the problem without tearing up your floors.",
        },
        {
          name: "Repiping",
          description:
            "Whole-home PEX and copper repiping for older homes with failing galvanized lines.",
        },
        {
          name: "Fixture Installation",
          description:
            "Faucets, toilets, garbage disposals, and showers installed cleanly and correctly.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you charge for estimates?",
          a: "No. Estimates are always free, and we give you a flat, upfront price before any work begins.",
        },
        {
          q: "What areas do you serve?",
          a: "We serve Austin and the surrounding area, including Round Rock, Cedar Park, Pflugerville, Georgetown, and Buda.",
        },
        {
          q: "Are you licensed and insured?",
          a: "Yes. Every Joe's Plumbing technician is licensed by the Texas State Board of Plumbing Examiners, and we're fully insured.",
        },
        {
          q: "Do you offer emergency service?",
          a: "Absolutely. Call us any time, day or night, including weekends and holidays.",
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
