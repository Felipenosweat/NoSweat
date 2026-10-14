import type { SiteSpec } from "@nosweat/schema";

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
    phone: "(619) 555-0163",
    email: "eat@rosaskitchen.example.com",
    city: "San Diego",
    state: "CA",
    serviceArea: "Barrio Logan, San Diego",
    hours: [{ days: "Tue–Sun", time: "11 AM – 9 PM" }],
  },
  theme: {
    primary: "#C2410C",
    secondary: "#15803D",
    background: "#FFFBF5",
    text: "#292524",
    font: "friendly",
  },
  sections: [
    {
      type: "hero",
      title: "Handmade tortillas, family recipes",
      subtitle:
        "A family Mexican kitchen in Barrio Logan. Walk in for carne asada and fish tacos, or call ahead to reserve a table.",
      ctaLabel: "Reserve a Table",
      imageQuery: "cozy restaurant booths",
      image: {
        url: "/photos/example-restaurant.webp",
        alt: "Warm restaurant booths set for dinner",
        source: "unsplash",
        kind: "scene",
        credit: { name: "Carlos Aranda", url: "https://unsplash.com/photos/IYMceGutrbQ" },
        width: 2400,
        height: 1602,
      },
    },
    {
      type: "services",
      items: [
        {
          name: "Carne Asada Plate",
          description: "Grilled marinated steak, rice, beans, and fresh handmade corn tortillas.",
        },
        {
          name: "Fish Tacos",
          description: "Beer-battered fish, cabbage slaw and our chipotle crema.",
        },
        {
          name: "Mole Poblano",
          description: "Grandma's mole poblano over tender chicken, served on Sundays.",
        },
        {
          name: "Weekend Brunch",
          description: "Chilaquiles, huevos rancheros and café de olla, Saturday and Sunday.",
        },
        {
          name: "Catering",
          description: "Taco bars and family-style trays for parties, offices, and celebrations.",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "Do you take reservations?",
          a: "Yes! Call us to reserve a table. Walk-ins are always welcome too.",
        },
        {
          q: "Do you have vegetarian options?",
          a: "Ask your server: several dishes can be made without meat, and we're happy to adjust when we can.",
        },
        {
          q: "Is there parking?",
          a: "Street parking is available nearby. Call us if you need directions.",
        },
      ],
    },
    {
      type: "contact",
      showForm: false,
      showMap: true,
    },
  ],
};
