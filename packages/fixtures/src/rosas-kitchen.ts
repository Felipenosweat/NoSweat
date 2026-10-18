import type { SiteSpec } from "@nosweat/schema";

// Modelo de restaurante (ver docs/design/model-sites.md). Fatos: briefs.ts.
export const rosasKitchen: SiteSpec = {
  version: 1,
  template: "restaurant",
  design: {
    composition: "immersive",
    primaryAction: "book",
    density: "balanced",
    imageTreatment: "natural",
  },
  business: {
    name: "Rosa's Kitchen",
    category: "Mexican restaurant",
    phone: "(619) 555-0163",
    email: "eat@rosaskitchen.example.com",
    address: "2196 Logan Ave",
    city: "San Diego",
    state: "CA",
    serviceArea: "Barrio Logan, San Diego",
    hours: [
      { days: "Tue–Sat", time: "11 AM – 9 PM" },
      { days: "Sun", time: "9 AM – 8 PM" },
    ],
  },
  theme: {
    primary: "#B23A1E",
    secondary: "#2F5D3A",
    background: "#FFF8EE",
    text: "#2A211C",
    font: "fresh",
  },
  sections: [
    {
      type: "hero",
      title: "Handmade tortillas, family recipes",
      subtitle:
        "A family Mexican kitchen in Barrio Logan. Walk in for carne asada and fish tacos, or call ahead to reserve a table.",
      ctaLabel: "Plan your visit",
      imageQuery: "chef plating mexican food",
      image: {
        url: "/photos/cook.webp",
        alt: "A cook plating food under copper lamps",
        source: "unsplash",
        kind: "scene",
        credit: { name: "Louis Hansel", url: "https://unsplash.com/photos/v3OlBE6-fhU" },
        width: 1169,
        height: 1800,
        focus: "50% 55%",
      },
    },
    {
      type: "services",
      items: [
        {
          group: "Plates",
          name: "Carne asada plate",
          description: "Grilled marinated steak, rice, beans and handmade corn tortillas.",
          price: "$18",
        },
        {
          group: "Plates",
          name: "Mole poblano",
          description: "Grandma's mole over tender chicken, with rice and tortillas.",
          price: "$17",
          detail: "Sundays",
        },
        {
          group: "Tacos",
          name: "Fish tacos",
          description: "Beer-battered fish, cabbage slaw and chipotle crema.",
          price: "$14",
        },
        {
          group: "Tacos",
          name: "Tacos al pastor",
          description: "Marinated pork off the grill, pineapple, onion and cilantro.",
          price: "$12",
        },
        {
          group: "Sunday brunch",
          name: "Chilaquiles",
          description: "Red or green, with eggs your way and crema.",
          price: "$13",
          detail: "Sundays until 1 PM",
        },
        {
          group: "Catering",
          name: "Taco bar for 20",
          description: "Two meats, tortillas, rice, beans and all the salsas.",
          price: "$320",
          detail: "48 hours notice",
        },
      ],
    },
    {
      type: "about",
      body: "Rosa Delgado opened the kitchen in 2014 with her mother's recipes. Her son Marco runs the grill, and the corn tortillas are still pressed by hand every morning.",
    },
    {
      type: "testimonials",
      items: [
        {
          quote: "The mole tastes like my abuela's, and I don't say that lightly.",
          author: "Teresa M.",
        },
        {
          quote: "We order the taco bar for every office lunch now.",
          author: "Kevin L.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you take reservations?",
          a: "Call us to reserve a table. Walk-ins are always welcome too.",
        },
        {
          q: "Is there parking?",
          a: "Street parking on Logan Ave.",
        },
        {
          q: "How much notice do you need for catering?",
          a: "48 hours for the taco bar. Send the form below or call us.",
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
