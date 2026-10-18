import type { SiteSpec } from "@nosweat/schema";

// Modelo de serviços para casa (ver docs/design/model-sites.md). Fatos: briefs.ts.
export const joesPlumbing: SiteSpec = {
  version: 1,
  template: "home-services",
  design: {
    composition: "service-led",
    primaryAction: "call",
    density: "compact",
    imageTreatment: "natural",
  },
  business: {
    name: "Joe's Plumbing",
    category: "Plumber",
    phone: "(512) 555-0142",
    email: "service@joesplumbing.example.com",
    city: "Austin",
    state: "TX",
    serviceArea: "Austin, Round Rock, Cedar Park and nearby",
    hours: [
      { days: "Mon–Sat", time: "7 AM – 6 PM" },
      { days: "Emergencies", time: "24/7" },
    ],
    highlights: ["Licensed & insured", "Free estimates", "Flat price before work starts"],
  },
  theme: {
    primary: "#C2410C",
    secondary: "#1E3A5F",
    background: "#FBFAF8",
    text: "#16202E",
    font: "bold",
  },
  sections: [
    {
      type: "hero",
      title: "Austin plumbing repairs, priced before we start",
      subtitle:
        "Water heaters, drains, slab leaks and repipes for homes across the Austin metro. Call and you talk to Joe or Maria, not a call center.",
      ctaLabel: "Request an estimate",
      imageQuery: "plumber tools water heater",
      image: {
        url: "/photos/example-plumbing.webp",
        alt: "A plumber tightening a fitting on a water heater",
        source: "unsplash",
        kind: "scene",
        credit: { name: "Marian Florinel Condruz", url: "https://unsplash.com/photos/C-oYJoIfgCs" },
        width: 2400,
        height: 2160,
        focus: "50% 40%",
      },
    },
    {
      type: "services",
      items: [
        {
          name: "Emergency repairs",
          description: "Burst pipes, major leaks and backed-up sewer lines, any hour of the day.",
          detail: "24/7",
        },
        {
          name: "Water heaters",
          description:
            "Repair and replacement of tank and tankless water heaters, usually same day.",
          detail: "Tank and tankless",
        },
        {
          name: "Drain cleaning",
          description: "Hydro-jetting and a camera inspection, so you see what was in the line.",
          price: "from $149",
        },
        {
          name: "Slab leak detection",
          description: "We find the leak under the slab before anyone breaks up your floor.",
        },
        {
          name: "Repiping",
          description: "Whole-home PEX repiping for older houses with failing galvanized lines.",
        },
        {
          name: "Fixture installs",
          description: "Faucets, toilets, garbage disposals and showers, installed and tested.",
        },
      ],
    },
    {
      type: "about",
      title: "Who picks up the phone",
      body: "Joe Ramirez, a master plumber, started Joe's Plumbing in 2009. Maria runs the schedule and writes the estimates, so when you call, you talk to one of them.",
      people: [
        { name: "Joe Ramirez", role: "Owner, master plumber" },
        { name: "Maria Ramirez", role: "Schedule and estimates" },
      ],
    },
    {
      type: "testimonials",
      items: [
        {
          quote:
            "Our water heater died on a Sunday. Maria had someone at the house by noon and the price was exactly what she said on the phone.",
          author: "Laura P., Round Rock",
        },
        {
          quote:
            "They ran a camera down the drain and showed me the root. No upsell, they just fixed it.",
          author: "Dev S., Cedar Park",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you charge for estimates?",
          a: "No. Estimates are free, and you get a flat price before any work begins.",
        },
        {
          q: "Is there a service call fee?",
          a: "The service call is $89, and we waive it if we do the work.",
        },
        {
          q: "What areas do you serve?",
          a: "Austin and the towns around it, including Round Rock, Cedar Park, Pflugerville, Georgetown and Buda.",
        },
        {
          q: "Do you take emergency calls?",
          a: "Yes. Emergencies are answered 24/7, including weekends and holidays.",
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
