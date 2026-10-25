import type { ModelEntry } from "./types";

// Modelo de restaurante: churrasco (barbecue) com pit fixo e food truck (composição tipográfica,
// sem foto: a frase do topo é a imagem). Todo fato do site está no `brief` (regra 8).
export const smokeAndRailBbq: ModelEntry = {
  slug: "smoke-and-rail-bbq",
  category: "restaurant",
  keywords: [
    "bbq",
    "barbecue",
    "barbeque",
    "smokehouse",
    "brisket",
    "burnt ends",
    "ribs",
    "pulled pork",
    "pitmaster",
    "smoker",
    "food truck",
    "bbq catering",
  ],
  brief: [
    "Smoke & Rail BBQ in Kansas City, MO. Our pit is at 1500 Genessee St in the West Bottoms, next to the rail yard, which is where the name comes from. I'm Darnell Hayes, pitmaster. I smoked in my backyard starting in 2011, put the truck on the road in 2018 and opened the pit in 2022. My wife Keisha runs catering and the truck.",
    "Brisket is smoked 14 hours over hickory and we cut it to order, fatty or lean. When it's gone, it's gone.",
    "Menu: brisket $16 a half pound, burnt ends $15 a half pound (Thursdays and Saturdays only), spare ribs $19 half slab / $34 full slab, pulled pork sandwich with vinegar slaw $12, sides $4 (cheesy corn, pit beans with brisket, vinegar slaw, mac and cheese). Whole briskets to go $95 with 48 hours notice. Sauce always on the side.",
    "Catering $22 per person (two meats, two sides, bread and sauce), 25 guests minimum, one week notice. The truck at your event from $1,500 for up to 100 guests, book a month ahead.",
    "The pit is open Thu–Sat 11 AM until we sell out. The truck is at the Crossroads on Tuesdays and River Market on Wednesdays, 11 AM – 2 PM. Preorder pickup at order.smokeandrail.example.com.",
    'Customers said: "Got there at 1:30 and the burnt ends were gone. Came back Thursday at 11 sharp. Worth it." (Ray T.) and "Keisha ran our wedding catering for 140 and nobody went home hungry." (Alyssa & Jordan)',
    "(816) 555-0128, smoke@smokeandrail.example.com.",
    "Style: bold, typographic",
  ].join("\n"),
  spec: {
    version: 1,
    template: "restaurant",
    design: {
      composition: "typographic",
      primaryAction: "visit",
      density: "compact",
      imageTreatment: "natural",
      rationale:
        "Pit that sells out: the headline is the poster, oxblood block with an ember-gold rule, schedule and phone up front.",
    },
    business: {
      name: "Smoke & Rail BBQ",
      category: "Barbecue pit & food truck",
      phone: "(816) 555-0128",
      email: "smoke@smokeandrail.example.com",
      address: "1500 Genessee St",
      city: "Kansas City",
      state: "MO",
      serviceArea: "West Bottoms, Crossroads & River Market",
      hours: [
        { days: "Thu–Sat · the pit", time: "11 AM – sold out" },
        { days: "Tue · truck at the Crossroads", time: "11 AM – 2 PM" },
        { days: "Wed · truck at River Market", time: "11 AM – 2 PM" },
      ],
      highlights: ["14 hours over hickory", "Sauce always on the side"],
      links: {
        order: "https://order.smokeandrail.example.com",
      },
    },
    theme: {
      primary: "#6E1E12",
      secondary: "#E3A857",
      background: "#F2EBE0",
      text: "#1B1512",
      font: "technical",
    },
    sections: [
      {
        type: "hero",
        title: "Kansas City barbecue in the West Bottoms",
        subtitle:
          "Brisket, burnt ends and ribs from our pit next to the rail yard, open Thursday to Saturday until we sell out. The truck is at the Crossroads on Tuesdays and River Market on Wednesdays.",
        ctaLabel: "Preorder for pickup",
      },
      {
        type: "services",
        title: "Menu",
        items: [
          {
            name: "Brisket",
            description: "Smoked 14 hours over hickory and cut to order, fatty or lean.",
            price: "$16",
            detail: "Half pound",
          },
          {
            name: "Burnt ends",
            description: "Cut from the point of the brisket.",
            price: "$15",
            detail: "Half pound · Thu & Sat only",
          },
          {
            name: "Spare ribs",
            description: "Smoked spare ribs, sold by the half or full slab.",
            price: "$19 half / $34 full",
            detail: "Slab",
          },
          {
            name: "Pulled pork sandwich",
            description: "Pulled pork on a bun with vinegar slaw.",
            price: "$12",
          },
          {
            name: "Sides",
            description: "Cheesy corn, pit beans with brisket, vinegar slaw, mac and cheese.",
            price: "$4",
            detail: "Each",
          },
          {
            name: "Whole brisket to go",
            description: "A whole smoked brisket to take home.",
            price: "$95",
            detail: "48 hours notice",
          },
          {
            name: "Catering",
            description: "Two meats, two sides, bread and sauce.",
            price: "$22 per person",
            detail: "25 guests min · one week notice",
          },
          {
            name: "The truck at your event",
            description: "We bring the truck to your event and serve up to 100 guests.",
            price: "from $1,500",
            detail: "Book a month ahead",
          },
        ],
      },
      {
        type: "about",
        title: "About us",
        body: "Darnell Hayes started smoking meat in his backyard in 2011. He put the truck on the road in 2018 and opened the pit at 1500 Genessee St in 2022, next to the West Bottoms rail yard, which is where the name comes from. His wife Keisha runs catering and the truck.",
        people: [
          { name: "Darnell Hayes", role: "Pitmaster & owner" },
          { name: "Keisha Hayes", role: "Catering & the truck" },
        ],
      },
      {
        type: "faq",
        title: "Questions",
        items: [
          {
            q: "When do you close?",
            a: "The pit opens Thu–Sat at 11 AM and stays open until we sell out. If you're coming later in the day, preorder.",
          },
          {
            q: "Where's the truck this week?",
            a: "Tuesdays at the Crossroads and Wednesdays at River Market, 11 AM – 2 PM.",
          },
          {
            q: "Can I preorder so I don't miss out?",
            a: "Yes, preorder online and pick up at the pit. Whole briskets need 48 hours notice.",
          },
          {
            q: "Is the sauce on everything?",
            a: "No, the sauce always comes on the side.",
          },
          {
            q: "How much notice for catering?",
            a: "One week, with a 25 guest minimum. If you want the truck at your event, book a month ahead.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "Got there at 1:30 and the burnt ends were gone, so I came back Thursday at 11 sharp. It was worth it.",
            author: "Ray T.",
          },
          {
            quote: "Keisha ran our wedding catering for 140 and nobody went home hungry.",
            author: "Alyssa & Jordan",
          },
        ],
      },
      {
        type: "contact",
        title: "Book catering or the truck",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
