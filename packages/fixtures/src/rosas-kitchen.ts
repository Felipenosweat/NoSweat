import type { SiteSpec } from "@nosweat/schema";

export const rosasKitchen: SiteSpec = {
  version: 1,
  template: "restaurant",
  business: {
    name: "Rosa's Kitchen",
    phone: "(619) 555-0163",
    email: "eat@rosaskitchen.example.com",
    city: "San Diego",
    state: "CA",
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
      title: "Homestyle Mexican Cooking in the Heart of San Diego",
      subtitle:
        "Family recipes, handmade tortillas, and the best carne asada in Barrio Logan. Come hungry, leave happy.",
      ctaLabel: "Reserve a Table",
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
          description: "Beer-battered local catch, cabbage slaw, and Rosa's secret chipotle crema.",
        },
        {
          name: "Mole Poblano",
          description:
            "Grandma's 30-ingredient mole served over tender chicken. A Sunday favorite.",
        },
        {
          name: "Weekend Brunch",
          description:
            "Chilaquiles, huevos rancheros, and bottomless café de olla, Saturday and Sunday.",
        },
        {
          name: "Catering",
          description: "Taco bars and family-style trays for parties, offices, and celebrations.",
        },
      ],
    },
    {
      type: "testimonials",
      items: [
        {
          quote:
            "The fish tacos are the best in San Diego, no contest. Feels like eating at a friend's house.",
          author: "Marcus J.",
        },
        {
          quote:
            "Rosa catered our office party for 60 people. Everything was hot, delicious, and on time.",
          author: "Elena P.",
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
          a: "Plenty. Try our roasted poblano tacos, veggie enchiladas, or the black bean sopes.",
        },
        {
          q: "Is there parking?",
          a: "Free street parking is available on Logan Avenue, plus a public lot one block away.",
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
