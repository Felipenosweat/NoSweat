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
      title: "Family Mexican cooking on Logan Ave",
      subtitle:
        "Rosa Delgado's family recipes in Barrio Logan, with corn tortillas pressed by hand every morning. Walk in, or call ahead for a table.",
      ctaLabel: "Reserve a table",
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
          description: "Grilled steak with rice, beans and our handmade corn tortillas.",
          price: "$18",
        },
        {
          group: "Plates",
          name: "Mole poblano",
          description: "Grandma's mole poblano over chicken, with rice and tortillas.",
          price: "$17",
          detail: "Sundays",
        },
        {
          group: "Tacos",
          name: "Fish tacos",
          description: "Fish tacos with our chipotle crema.",
          price: "$14",
        },
        {
          group: "Tacos",
          name: "Tacos al pastor",
          description: "Pork al pastor with pineapple, onion and cilantro.",
          price: "$12",
        },
        {
          group: "Sunday brunch",
          name: "Chilaquiles",
          description: "Red or green, with eggs and crema.",
          price: "$13",
          detail: "Sundays until 1 PM",
        },
        {
          group: "Catering",
          name: "Taco bar for 20",
          description: "Two meats, tortillas, rice, beans and salsas for 20 people.",
          price: "$320",
          detail: "48 hours notice",
        },
      ],
    },
    {
      type: "about",
      body: "Rosa Delgado opened the restaurant in 2014, cooking from her mother's recipes. Her son Marco runs the grill, and we still press the corn tortillas by hand every morning.",
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
          a: "Yes, call us to reserve a table. Walk-ins are welcome too.",
        },
        {
          q: "Is there parking?",
          a: "Street parking on Logan Ave.",
        },
        {
          q: "How much notice do you need for catering?",
          a: "We need 48 hours for the taco bar. Use the form below or give us a call.",
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
