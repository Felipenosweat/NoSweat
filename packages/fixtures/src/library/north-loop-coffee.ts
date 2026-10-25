import type { ModelEntry } from "./types";

// Modelo de restaurante: café de bairro (composição editorial; foto do topo = o espresso).
// Todo fato do site está no `brief`, nas palavras da "dona" (regra 8).
export const northLoopCoffee: ModelEntry = {
  slug: "north-loop-coffee",
  category: "restaurant",
  keywords: [
    "coffee",
    "coffee shop",
    "cafe",
    "espresso",
    "latte",
    "cortado",
    "pour-over",
    "roaster",
    "roastery",
    "beans",
    "pastries",
    "breakfast sandwich",
    "barista",
  ],
  brief: [
    "North Loop Coffee, a neighborhood coffee shop and cafe at 418 Washington Ave N in the North Loop, Minneapolis, MN. My husband Theo and I (Hannah Lindqvist) opened it in 2017 in an old printing warehouse. I roast the beans on a 12-kilo roaster in the back every Monday and Thursday; Theo runs the kitchen and bakes the pastry case every morning; Ramón Ortiz is our head barista and trains everyone on the bar.",
    "Menu: cortado $4.25, oat milk latte $5.50 (12 oz, no upcharge for oat), pour-over of the single origin of the week $5, cardamom buns $4.75 from my grandmother's recipe (they usually sell out by 10 on Saturdays), blueberry corn muffin $3.75, egg and cheddar on an English muffin with chive butter $8.50 (add bacon $2, served until 1 PM), lox toast on rye $11, and our house blend to take home, $17 for a 12 oz bag, ground for free if you ask. 5 lb bags for offices are $75 with a week's notice.",
    "Open Mon–Fri 6:30 AM – 3 PM, Sat–Sun 7:30 AM – 3 PM. Order ahead online at order.northloopcoffee.example.com and pick up at the end of the bar. Free Wi-Fi and outlets at every table, dogs welcome on the patio. Metered street parking on Washington Ave N, and it's a short walk from the Target Field light rail station.",
    'Regulars wrote: "I\'ve had the same cortado every weekday for three years and they still ask if I want it for here." (Jess K.) and "The cardamom buns are gone by ten on Saturdays. Get there early." (Dan P.)',
    "(612) 555-0137, hello@northloopcoffee.example.com.",
    "Style: editorial, calm",
  ].join("\n"),
  spec: {
    version: 1,
    template: "restaurant",
    design: {
      composition: "editorial",
      primaryAction: "visit",
      density: "airy",
      imageTreatment: "natural",
      rationale:
        "Neighborhood cafe: a magazine-style page where the roasting story and the menu carry it, one calm teal for every action.",
    },
    business: {
      name: "North Loop Coffee",
      category: "Coffee shop & roastery",
      phone: "(612) 555-0137",
      email: "hello@northloopcoffee.example.com",
      address: "418 Washington Ave N",
      city: "Minneapolis",
      state: "MN",
      serviceArea: "North Loop, Minneapolis",
      hours: [
        { days: "Mon–Fri", time: "6:30 AM – 3 PM" },
        { days: "Sat–Sun", time: "7:30 AM – 3 PM" },
      ],
      highlights: ["Roasted in house Mon & Thu", "Wi-Fi and outlets at every table"],
      links: {
        order: "https://order.northloopcoffee.example.com",
      },
    },
    theme: {
      primary: "#1F4D5A",
      secondary: "#C98B3C",
      background: "#F4EFE6",
      text: "#1E1B18",
      font: "classic",
    },
    sections: [
      {
        type: "hero",
        title: "Neighborhood coffee in the North Loop",
        subtitle:
          "We're in an old printing warehouse on Washington Ave N. We roast our own beans in the back, Theo bakes the pastry case every morning, and we're open until 3.",
        ctaLabel: "Order ahead",
        imageQuery: "espresso cup on saucer with coffee beans",
        image: {
          url: "/photos/models/north-loop-coffee-6.webp",
          alt: "An espresso in a white ceramic cup on a saucer, with a few roasted coffee beans beside it",
          source: "upload",
          kind: "scene",
          credit: {
            name: "scribblesteve",
            url: "https://www.flickr.com/photos/33434850@N06/5598864934",
          },
          width: 1024,
          height: 680,
          focus: "50% 45%",
        },
      },
      {
        type: "about",
        title: "About us",
        body: "Theo and I opened North Loop Coffee in 2017 in an old printing warehouse. I roast the beans on a 12-kilo roaster in the back every Monday and Thursday. Theo runs the kitchen and bakes the pastry case each morning, and Ramón, our head barista, trains everyone who works the bar.",
        people: [
          {
            name: "Hannah Lindqvist",
            role: "Owner & roaster",
            note: "Roasts every bean on the 12-kilo roaster in the back, Mondays and Thursdays.",
          },
          {
            name: "Theo Lindqvist",
            role: "Owner & kitchen",
            note: "Runs the kitchen and bakes the pastry case every morning.",
          },
          {
            name: "Ramón Ortiz",
            role: "Head barista",
            note: "Trains everyone who works the bar.",
          },
        ],
      },
      {
        type: "services",
        title: "Menu",
        items: [
          {
            group: "Espresso bar",
            name: "Cortado",
            description: "Espresso with an equal amount of steamed milk.",
            price: "$4.25",
          },
          {
            group: "Espresso bar",
            name: "Oat milk latte",
            description: "Espresso and steamed oat milk. We don't charge extra for oat.",
            price: "$5.50",
            detail: "12 oz",
          },
          {
            group: "Espresso bar",
            name: "Pour-over",
            description: "The single origin of the week, brewed by the cup.",
            price: "$5",
            detail: "Ask what's on",
          },
          {
            group: "Pastry case",
            name: "Cardamom bun",
            description:
              "Made from Hannah's grandmother's recipe. They usually sell out early on Saturdays.",
            price: "$4.75",
            detail: "Gone by 10 on Saturdays",
          },
          {
            group: "Pastry case",
            name: "Blueberry corn muffin",
            description: "A blueberry muffin made with cornmeal.",
            price: "$3.75",
          },
          {
            group: "Breakfast",
            name: "Egg & cheddar",
            description:
              "Egg, cheddar and chive butter on an English muffin. Add bacon for $2.",
            price: "$8.50",
            detail: "Until 1 PM",
          },
          {
            group: "Breakfast",
            name: "Lox toast",
            description: "Lox on rye toast.",
            price: "$11",
          },
          {
            group: "Beans to go",
            name: "House blend, 12 oz",
            description:
              "Our house blend, roasted here. We'll grind it for free if you ask. Office bags of 5 lb are $75.",
            price: "$17",
            detail: "5 lb bags: a week's notice",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Reviews",
        items: [
          {
            quote:
              "I've had the same cortado every weekday for three years and they still ask if I want it for here.",
            author: "Jess K.",
          },
          {
            quote: "The cardamom buns are gone by ten on Saturdays. Get there early.",
            author: "Dan P.",
          },
        ],
      },
      {
        type: "faq",
        title: "Questions",
        items: [
          {
            q: "Can I order ahead?",
            a: "Yes. Order online and pick it up at the end of the bar.",
          },
          {
            q: "Is it OK to work from the cafe?",
            a: "Yes. Wi-Fi is free and every table has outlets.",
          },
          {
            q: "Can I bring my dog?",
            a: "Dogs are welcome on the patio.",
          },
          {
            q: "Do you sell beans for offices?",
            a: "Yes, 5 lb bags of the house blend are $75 with a week's notice.",
          },
          {
            q: "Where do I park?",
            a: "Metered street parking on Washington Ave N. We're also a short walk from the Target Field light rail station.",
          },
        ],
      },
      {
        type: "contact",
        title: "Visit us on Washington Ave N",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
