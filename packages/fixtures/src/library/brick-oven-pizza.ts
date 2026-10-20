import type { ModelEntry } from "./types";

// Modelo de restaurante: pizzaria de bairro com pedido online e catering (composição modular).
// Todo fato do site está no `brief`, nas palavras do "dono" (regra 8).
export const brickOvenPizza: ModelEntry = {
  slug: "brick-oven-pizza",
  category: "restaurant",
  keywords: [
    "pizza",
    "pizzeria",
    "wood-fired",
    "wood fired",
    "brick oven",
    "slices",
    "pies",
    "neapolitan",
    "garlic knots",
    "takeout",
    "delivery",
    "pizza catering",
  ],
  brief: [
    "Brick Oven Pizza Co., a wood-fired pizzeria at 641 Graham Ave in Brooklyn, NY. I'm Nicky Abate, the pizzaiolo; my dad and I built the oven by hand in 2015. It runs at 900 degrees on oak, so a pie bakes in about 90 seconds. My wife Lena runs the front and all the catering, and Omar Haddad runs the slice counter.",
    "Menu: 16-inch pies, the Margherita $22, the Graham (hot soppressata, honey, chili flake) $27, the white pie with ricotta, garlic and lemon zest $25. Slices all day until close: cheese $4, cup-and-char pepperoni $5. Garlic knots $7 for six. Gluten-free crust is $3 more but it bakes in the same oven, so it's not safe for celiac. Half-and-half pies are fine.",
    "Catering: a party pack for about 20 people is $150, five pies of your choice plus garlic knots and a Caesar, with 24 hours notice. We also bring our mobile oven to your event from $1,200, 50 guests minimum, book 3 weeks ahead.",
    "Open Mon–Thu 12 PM – 10 PM, Fri–Sat 12 PM – 11 PM, Sun 12 PM – 9 PM. Order pickup or delivery online at order.brickovenpizza.example.com, delivery within 1.5 miles. No reservations; for 6 or more call ahead and we'll hold a table.",
    'People said: "We drive in from Astoria for the white pie." (Priya & Sam) and "Lena handled pizza for 60 at our block party and it showed up hot." (Marcus D.)',
    "(718) 555-0174, orders@brickovenpizza.example.com.",
    "Style: bold, energetic",
  ].join("\n"),
  spec: {
    version: 1,
    template: "restaurant",
    design: {
      composition: "modular",
      primaryAction: "visit",
      density: "compact",
      imageTreatment: "natural",
      rationale:
        "Busy slice shop with online orders: a block grid puts order, hours and phone side by side, tomato red only for actions.",
    },
    business: {
      name: "Brick Oven Pizza Co.",
      category: "Wood-fired pizzeria",
      phone: "(718) 555-0174",
      email: "orders@brickovenpizza.example.com",
      address: "641 Graham Ave",
      city: "Brooklyn",
      state: "NY",
      serviceArea: "Delivery within 1.5 miles",
      hours: [
        { days: "Mon–Thu", time: "12 PM – 10 PM" },
        { days: "Fri–Sat", time: "12 PM – 11 PM" },
        { days: "Sun", time: "12 PM – 9 PM" },
      ],
      highlights: ["Slices all day until close", "Oven built by hand in 2015"],
      links: {
        order: "https://order.brickovenpizza.example.com",
      },
    },
    theme: {
      primary: "#B3201A",
      secondary: "#F0C24B",
      background: "#FFFDF7",
      text: "#141414",
      font: "bold",
    },
    sections: [
      {
        type: "hero",
        title: "Ninety seconds at 900 degrees",
        subtitle:
          "Wood-fired pies from an oak-burning oven we built by hand on Graham Ave. Grab a slice at the counter, order a pie for pickup or delivery, or have us bring the oven to your party.",
        ctaLabel: "Order pickup or delivery",
        imageQuery: "pizza baking in wood fired brick oven",
        image: {
          url: "/photos/models/brick-oven-pizza-6.webp",
          alt: "A pizza baking on the brick floor of a wood-fired oven, next to burning logs",
          source: "upload",
          kind: "scene",
          credit: {
            name: "Lotus Head from Johannesburg, Gauteng, South Africa",
            url: "https://commons.wikimedia.org/w/index.php?curid=358898",
          },
          width: 1600,
          height: 1200,
          focus: "55% 55%",
        },
      },
      {
        type: "services",
        title: "Out of the oven",
        items: [
          {
            group: "16-inch pies",
            name: "Margherita",
            description: "San Marzano tomato, fresh mozzarella, basil and olive oil.",
            price: "$22",
          },
          {
            group: "16-inch pies",
            name: "The Graham",
            description: "Hot soppressata, mozzarella, a drizzle of honey and chili flake.",
            price: "$27",
          },
          {
            group: "16-inch pies",
            name: "White pie",
            description: "Ricotta, mozzarella, roasted garlic and lemon zest. No sauce.",
            price: "$25",
            detail: "Gluten-free crust +$3",
          },
          {
            group: "By the slice",
            name: "Cheese slice",
            description: "Straight from the counter, reheated in the wood oven.",
            price: "$4",
            detail: "Until close",
          },
          {
            group: "By the slice",
            name: "Pepperoni slice",
            description: "Cup-and-char pepperoni that curls and crisps at the edges.",
            price: "$5",
            detail: "Until close",
          },
          {
            group: "On the side",
            name: "Garlic knots",
            description: "Six knots tossed in garlic butter and parsley.",
            price: "$7",
            detail: "6 pieces",
          },
          {
            group: "Catering",
            name: "Party pack",
            description: "Five pies of your choice, garlic knots and a Caesar. Feeds about 20.",
            price: "$150",
            detail: "24 hours notice",
          },
          {
            group: "Catering",
            name: "Mobile oven at your event",
            description: "We tow the oven to you and bake on site. 50 guests minimum.",
            price: "from $1,200",
            detail: "Book 3 weeks ahead",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Heard at the counter",
        items: [
          { quote: "We drive in from Astoria for the white pie.", author: "Priya & Sam" },
          {
            quote: "Lena handled pizza for 60 at our block party and it showed up hot.",
            author: "Marcus D.",
          },
        ],
      },
      {
        type: "about",
        title: "Our story",
        body: "Nicky Abate and his dad built the oven brick by brick in 2015. It burns oak at 900 degrees, which is why a pie takes about 90 seconds and comes out blistered and soft in the middle. Nicky stretches every pie, Lena runs the front and every catering order, and Omar keeps the slice counter going until close.",
        people: [
          { name: "Nicky Abate", role: "Owner & pizzaiolo" },
          { name: "Lena Abate", role: "Front of house & catering" },
          { name: "Omar Haddad", role: "Slice counter" },
        ],
      },
      {
        type: "faq",
        title: "Good to know",
        items: [
          {
            q: "Do you deliver?",
            a: "Yes, within 1.5 miles. Order online or call the shop.",
          },
          {
            q: "Can I reserve a table?",
            a: "We don't take reservations. For 6 or more, call ahead and we'll hold a table.",
          },
          {
            q: "Do you have gluten-free crust?",
            a: "Yes, for $3 more. It bakes in the same oven as everything else, so it's not safe for celiac.",
          },
          {
            q: "Can I get half and half?",
            a: "Sure, any two of our pies on one.",
          },
          {
            q: "How does the mobile oven work?",
            a: "We bring the oven and bake on site, from $1,200 with a 50 guest minimum. Book 3 weeks ahead with the form below.",
          },
        ],
      },
      {
        type: "contact",
        title: "Catering & big orders",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
