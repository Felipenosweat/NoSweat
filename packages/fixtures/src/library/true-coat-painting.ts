import type { ModelEntry } from "./types";

// Modelo de pintura residencial (serviços para casa) na composição editorial: título de revista,
// serviços como sumário numerado. A tipografia carrega o topo; embaixo, uma faixa 21:9 de camadas
// de tinta velha descascando ilustra o título ("prep is the paint job") e repete a terracota e o
// verde do tema. É cena (kind "scene"), não obra da empresa. Sem galeria: nenhuma foto de
// interior ou fachada candidata tinha qualidade. Fatos: só os do brief. Foto: Flickr, CC BY 2.0.
export const trueCoatPainting: ModelEntry = {
  slug: "true-coat-painting",
  category: "home-services",
  keywords: [
    "painter",
    "painting",
    "house painting",
    "interior painting",
    "exterior painting",
    "cabinet painting",
    "cabinet refinishing",
    "deck staining",
    "stain",
    "color consultation",
    "drywall repair",
    "trim",
  ],
  brief: [
    "True Coat Painting, interior and exterior house painting in Portland, OR. I'm Hannah Lindqvist; I've been painting Portland houses since 2011 and started True Coat in 2017. Theo Nakamura is my crew lead and runs our cabinet spray shop. We're a crew of four.",
    "Licensed with the Oregon CCB and insured. EPA lead-safe certified, which matters here because most of the houses we paint were built before 1978; the crew sets up containment before any scraping or sanding. Low-VOC paint by default. 2-year warranty on our workmanship: if something peels, call me and we come back to fix it. 10% deposit to book.",
    "The way I see it, prep is the paint job and the color is the easy part: we spend most of every job scraping, patching, caulking and taping, because that's what makes two coats last.",
    "Interior painting from $450 a room (walls, ceilings and trim, furniture moved and covered). Exterior painting May through September, when Portland is dry enough for paint to cure properly, quoted after a walkthrough because prep on an older house varies a lot: scrape, spot-prime, two coats. Cabinet refinishing from $3,800 for an average kitchen, doors sprayed in our shop, about 2 weeks. Deck staining from $650: wash, sand and two coats of penetrating stain. Color consultation $150 (90 minutes at your house), credited toward the job if you hire us.",
    "Office hours Mon–Fri 8 AM – 5 PM. Our shop is at 3316 SE Division St, color samples there by appointment. We paint across Portland, Milwaukie, Lake Oswego and Beaverton.",
    'Clients said: "Hannah talked us out of the gray everyone has and into a green we still love every time we pull up." (Megan & Chris, Sellwood) and "Theo\'s crew taped off a 1912 house like it was a museum. Not one drip on the floors." (Paul R., Laurelhurst) and "The kitchen cabinets look factory-made. We had our sink back the whole time." (Dana L., Beaverton)',
    "(503) 555-0174, hello@truecoat.example.com, Instagram https://instagram.example.com/truecoatpdx.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "home-services",
    design: {
      composition: "editorial",
      primaryAction: "quote",
      density: "airy",
      imageTreatment: "natural",
    },
    business: {
      name: "True Coat Painting",
      category: "House painter",
      phone: "(503) 555-0174",
      email: "hello@truecoat.example.com",
      address: "3316 SE Division St",
      city: "Portland",
      state: "OR",
      serviceArea: "Portland, Milwaukie, Lake Oswego and Beaverton",
      hours: [{ days: "Mon–Fri", time: "8 AM – 5 PM" }],
      highlights: ["Oregon CCB licensed", "EPA lead-safe certified", "2-year warranty"],
      links: { instagram: "https://instagram.example.com/truecoatpdx" },
    },
    theme: {
      // Terracota como única cor de ação; azul-sálvia só em fios finos.
      primary: "#A8432A",
      secondary: "#6E8B8A",
      background: "#FAF7F2",
      text: "#26211D",
      font: "editorial",
    },
    sections: [
      {
        type: "hero",
        title: "Prep is the paint job. The color is the easy part.",
        subtitle:
          "Interior and exterior painting, cabinets and decks for Portland houses. We spend most of every job scraping, patching, caulking and taping, because that's what makes two coats last.",
        ctaLabel: "Book a walkthrough",
        image: {
          url: "/photos/models/true-coat-painting-1.webp",
          alt: "Layers of old ochre, green and gray paint flaking off a plaster wall",
          source: "upload",
          kind: "scene",
          credit: {
            name: "Radoslav Minchev",
            url: "https://www.flickr.com/photos/25566545@N02/6017423260",
          },
          width: 1023,
          height: 731,
          focus: "40% 45%",
        },
      },
      {
        type: "about",
        title: "Old Portland houses, one wall at a time",
        body: "Hannah Lindqvist has been painting Portland houses since 2011 and started True Coat in 2017. Most of the homes we paint were built before 1978, so the crew of four is EPA lead-safe certified and uses low-VOC paint by default. Hannah writes every estimate and helps with color; Theo runs the crew and the cabinet spray shop on SE Division.",
        people: [
          {
            name: "Hannah Lindqvist",
            role: "Owner, estimates and color",
            note: "Painting Portland houses since 2011.",
          },
          {
            name: "Theo Nakamura",
            role: "Crew lead, cabinet spray shop",
          },
        ],
      },
      {
        type: "services",
        title: "What we paint",
        items: [
          {
            name: "Interior painting",
            description:
              "Walls, ceilings and trim. We move and cover the furniture, patch the dings and leave the room ready to live in.",
            price: "from $450 a room",
          },
          {
            name: "Exterior painting",
            description:
              "Scrape, spot-prime and two coats, scheduled for the dry months so the paint cures right.",
            detail: "May through September, quoted after a walkthrough",
          },
          {
            name: "Cabinet refinishing",
            description:
              "Doors come off and get sprayed in our shop for a smooth, even finish. Your kitchen stays usable.",
            detail: "About 2 weeks",
            price: "from $3,800",
          },
          {
            name: "Deck staining",
            description: "Washed, sanded and finished with two coats of penetrating stain.",
            price: "from $650",
          },
          {
            name: "Color consultation",
            description:
              "Ninety minutes at your house with samples on your walls, in your light. Credited toward the job if you hire us.",
            detail: "90 minutes",
            price: "$150",
          },
        ],
      },
      {
        type: "testimonials",
        title: "From the houses we've painted",
        items: [
          {
            quote:
              "Hannah talked us out of the gray everyone has and into a green we still love every time we pull up.",
            author: "Megan & Chris, Sellwood",
          },
          {
            quote:
              "Theo's crew taped off a 1912 house like it was a museum. Not one drip on the floors.",
            author: "Paul R., Laurelhurst",
          },
          {
            quote: "The kitchen cabinets look factory-made. We had our sink back the whole time.",
            author: "Dana L., Beaverton",
          },
        ],
      },
      {
        type: "faq",
        title: "Before we start",
        items: [
          {
            q: "How do you price a job?",
            a: "Interior rooms start at $450. Exteriors are quoted after a walkthrough, because prep on an older house varies a lot. A 10% deposit books your dates.",
          },
          {
            q: "My house is older. What about lead paint?",
            a: "Most of the houses we paint were built before 1978. Our crew is EPA lead-safe certified and sets up containment before any scraping or sanding.",
          },
          {
            q: "When can you paint the outside?",
            a: "May through September, when Portland is dry enough for the paint to cure properly.",
          },
          {
            q: "Can we use the kitchen while you do the cabinets?",
            a: "Yes. The doors are sprayed in our shop, and the job takes about 2 weeks. You keep your sink the whole time.",
          },
          {
            q: "What if something peels?",
            a: "Our workmanship has a 2-year warranty. Call Hannah and we come back to fix it.",
          },
          {
            q: "Can I see colors before I decide?",
            a: "Yes. Book a $150 color consultation at your house, or look at samples at our shop on SE Division by appointment.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a walkthrough",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
