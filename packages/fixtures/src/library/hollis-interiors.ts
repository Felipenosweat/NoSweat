import type { SiteImage } from "@nosweat/schema";
import type { ModelEntry } from "./types";

/** Crédito de uma foto da Paintzen no Flickr (CC BY 2.0). */
const PAINTZEN = (id: string) => ({
  name: "Paintzen",
  url: `https://www.flickr.com/photos/147489968@N06/${id}`,
});

/** Foto de trabalho (papel de foto da dona), do Flickr, com o tamanho do arquivo. */
function room(
  n: number,
  alt: string,
  caption: string,
  id: string,
  width: number,
  height: number,
): SiteImage {
  return {
    url: `/photos/models/hollis-interiors-${n}.webp`,
    alt,
    source: "upload",
    kind: "owner",
    credit: PAINTZEN(id),
    width,
    height,
    caption,
  };
}

// Modelo de portfólio: designer de interiores em Nashville (composição "immersive").
// O trabalho vem primeiro: foto de ponta a ponta no topo e a galeria logo depois. As fotos fazem
// o papel das fotos da dona (kind "owner", como em vega-photo.ts): Flickr, CC BY 2.0, crédito em
// `credit`. São 3 de propósito (só 4 fotos boas no lote, todas da mesma casa; nenhuma fraca para
// encher). Legendas usam só projetos do brief. Todo fato do site está no brief (regra 8).
export const hollisInteriors: ModelEntry = {
  slug: "hollis-interiors",
  category: "portfolio",
  keywords: [
    "interior designer",
    "interior design",
    "interiors",
    "home design",
    "kitchen design",
    "bathroom design",
    "e-design",
    "decorator",
    "furnishing",
    "renovation design",
    "space planning",
  ],
  brief: [
    "Hollis Interiors is my interior design studio at 1104 Woodland St, Suite 2 in East Nashville, Nashville, TN. I'm Claire Hollis, principal designer. I opened the studio in 2017 after 8 years at an architecture firm. Jess Tran is our project manager: she runs contractors, orders and install day.",
    "We take on about 10 full projects a year in Nashville, Franklin, Brentwood and Middle Tennessee. E-design works anywhere in the US.",
    "Full-home design from $18,000 (4–9 months), kitchen & bath design from $7,500 per room (3–5 months), single room design from $3,200 (6–8 weeks), e-design $950 per room (remote, 3 weeks) and an in-home consultation for $350 (2 hours). Design fees are flat and quoted after the consultation. Furniture and fixtures are ordered at our trade price and passed to you at cost plus 15%.",
    "Recent projects: a 1920s Craftsman in East Nashville (2025), a kitchen and two baths in a Belmont-Hillsboro foursquare (2025), a lake house on Percy Priest Lake (2024) and a loft in Germantown (2024).",
    'Clients wrote: "Claire talked us out of the expensive tile and into the right one. The kitchen feels like it was always there." (Rachel & Tom, Belmont-Hillsboro) and "Jess ran install day like a stage manager. We left for the weekend and came home to a finished house." (David K., Percy Priest Lake)',
    "Studio visits by appointment, Mon–Fri 9 AM – 5 PM. Book a consultation at hollisinteriors.example.com/consult.",
    "(615) 555-0134, studio@hollisinteriors.example.com.",
    "Style: warm & elegant",
  ].join("\n"),
  spec: {
    version: 1,
    template: "portfolio",
    design: {
      composition: "immersive",
      primaryAction: "book",
      density: "airy",
      imageTreatment: "natural",
      rationale:
        "Interior design sells a feeling first: a finished room behind the headline, the rooms themselves right after, then the fees.",
    },
    business: {
      name: "Hollis Interiors",
      category: "Interior designer",
      phone: "(615) 555-0134",
      email: "studio@hollisinteriors.example.com",
      address: "1104 Woodland St, Suite 2",
      city: "Nashville",
      state: "TN",
      serviceArea: "Nashville, Franklin, Brentwood and Middle Tennessee",
      hours: [{ days: "Mon–Fri", time: "9 AM – 5 PM, by appointment" }],
      links: { booking: "https://hollisinteriors.example.com/consult" },
    },
    theme: {
      primary: "#7A4B32",
      secondary: "#A3AE97",
      background: "#F5F0E8",
      text: "#22201C",
      font: "luxe",
    },
    sections: [
      {
        type: "hero",
        title: "Homes that feel collected, not ordered from a catalog",
        subtitle:
          "Full-home design, kitchens and baths for old Nashville houses and new ones. About 10 projects a year, each one drawn around how the family actually lives.",
        ctaLabel: "Book a consultation",
        image: {
          url: "/photos/models/hollis-interiors-11.webp",
          alt: "A white kitchen with a marble-topped island, two steel pendant lights, subway tile and dark oak floors",
          source: "upload",
          kind: "owner",
          credit: PAINTZEN("29813588732"),
          width: 1024,
          height: 669,
          focus: "50% 60%",
        },
      },
      {
        type: "gallery",
        title: "Selected work",
        images: [
          room(
            9,
            "A farmhouse sink in a marble island facing a steel range, white cabinets and subway tile",
            "01 · Kitchen · Belmont-Hillsboro foursquare · 2025",
            "29300385324",
            1024,
            669,
          ),
          room(
            14,
            "A bedroom with a tufted headboard, a navy quilt, a floor mirror and plantation shutters",
            "02 · Bedroom · 1920s Craftsman, East Nashville · 2025",
            "29813589472",
            1024,
            676,
          ),
          room(
            15,
            "A bedside table with mirrored drawers and a white lamp beside a tufted bed with navy bedding",
            "03 · Bedroom · 1920s Craftsman, East Nashville · 2025",
            "29844388151",
            1023,
            655,
          ),
        ],
      },
      {
        type: "about",
        title: "Who makes them",
        body: "I opened the studio in 2017 after 8 years at an architecture firm, so we start with the floor plan and the light before we talk about pillows. Jess keeps the contractors, orders and install day on schedule.\n\nAlso lately: a lake house on Percy Priest Lake (2024) and a loft in Germantown (2024).",
        people: [
          {
            name: "Claire Hollis",
            role: "Principal designer",
            note: "Opened the studio in 2017 after 8 years at an architecture firm.",
          },
          {
            name: "Jess Tran",
            role: "Project manager",
            note: "Runs contractors, orders and install day.",
          },
        ],
      },
      {
        type: "services",
        title: "Ways to work with us",
        items: [
          {
            name: "In-home consultation",
            description:
              "Two hours walking your house with a notebook. You leave with a plan and a flat quote for the design.",
            price: "$350",
            detail: "2 hours",
            group: "Start here",
          },
          {
            name: "Full-home design",
            description:
              "Floor plans, finishes, lighting, furniture and art, through to the last picture hung on install day.",
            price: "from $18,000",
            detail: "4–9 months",
            group: "Full projects",
          },
          {
            name: "Kitchen & bath",
            description:
              "Layout, cabinetry drawings, tile, plumbing fixtures and lighting, coordinated with your contractor.",
            price: "from $7,500",
            detail: "Per room · 3–5 months",
            group: "Full projects",
          },
          {
            name: "Single room",
            description: "One room designed and furnished: a living room, a bedroom, a study.",
            price: "from $3,200",
            detail: "6–8 weeks",
            group: "Full projects",
          },
          {
            name: "E-design",
            description:
              "A floor plan, a shopping list with links and a call to walk through it. Anywhere in the US.",
            price: "$950",
            detail: "Per room · remote · 3 weeks",
            group: "From afar",
          },
        ],
      },
      {
        type: "testimonials",
        title: "From the people who live there",
        items: [
          {
            quote:
              "Claire talked us out of the expensive tile and into the right one. The kitchen feels like it was always there.",
            author: "Rachel & Tom, Belmont-Hillsboro",
          },
          {
            quote:
              "Jess ran install day like a stage manager. We left for the weekend and came home to a finished house.",
            author: "David K., Percy Priest Lake",
          },
        ],
      },
      {
        type: "faq",
        title: "Working together",
        items: [
          {
            q: "How do your fees work?",
            a: "Design fees are flat and quoted after the in-home consultation, so you know the number before we start.",
          },
          {
            q: "What about furniture and fixtures?",
            a: "We order at our trade price and pass it to you at cost plus 15%.",
          },
          {
            q: "Where do you work?",
            a: "Full projects in Nashville, Franklin, Brentwood and Middle Tennessee. E-design works anywhere in the US.",
          },
          {
            q: "How long does a project take?",
            a: "A single room takes 6–8 weeks, a kitchen or bath 3–5 months, a full home 4–9 months.",
          },
          {
            q: "Can I visit the studio?",
            a: "Yes, by appointment, Mon–Fri 9 AM – 5 PM, at 1104 Woodland St in East Nashville.",
          },
        ],
      },
      {
        type: "contact",
        title: "Tell us about the house",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
