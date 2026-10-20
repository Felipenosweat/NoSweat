import type { SiteImage } from "@nosweat/schema";
import type { ModelEntry } from "./types";

/** Foto de trabalho (papel de foto do dono), 1024px, do Flickr. */
function work(
  n: number,
  alt: string,
  caption: string,
  credit: { name: string; url: string },
  height: number,
): SiteImage {
  return {
    url: `/photos/models/greenline-landscaping-${n}.webp`,
    alt,
    source: "upload",
    kind: "owner",
    credit,
    width: 1024,
    height,
    caption,
  };
}

const CWWYCOFF = (id: string) => ({
  name: "cwwycoff1",
  url: `https://www.flickr.com/photos/80909625@N00/${id}`,
});

// Modelo de paisagismo e gramado (serviços para casa) na composição imersiva: foto de ponta a
// ponta no topo, faixa de informações e serviços como cardápio em grupos. Fatos: só os do brief.
// A galeria faz o papel das fotos do próprio dono (kind "owner", como em vega-photo.ts): fotos do
// Flickr (CC BY / BY-SA 2.0, crédito em `credit`), legendas só descrevem o serviço, sem lugar nem
// ano (o brief não cita obras). São 5 de propósito: a parede ("wall") fecha a grade com 5.
export const greenlineLandscaping: ModelEntry = {
  slug: "greenline-landscaping",
  category: "home-services",
  keywords: [
    "landscaping",
    "landscaper",
    "lawn care",
    "lawn",
    "mowing",
    "yard",
    "irrigation",
    "sprinkler",
    "sod",
    "mulch",
    "hedge trimming",
    "leaf cleanup",
    "landscape design",
  ],
  brief: [
    "Greenline Landscaping, lawn care and landscaping in Charlotte, NC. My brother Kevin and I (Andre Simmons) started it in 2015 with one mower and a borrowed trailer. I'm a North Carolina licensed irrigation contractor; Kevin draws the designs and runs the install crew. Brenda Ortiz runs the schedule and the billing.",
    "Charlotte yards fight red clay, summer drought and fescue that browns out by July, so we plan every yard around that.",
    "Weekly mowing from $45 a visit (mow, edge, string-trim and blow off the hard surfaces), March through November, same crew every week. Shrub and hedge trimming from $120, in spring and late summer. Landscape design and installs: Kevin draws a plan and you get a fixed price before we dig. Sod and seeding: fescue in the fall, Bermuda and zoysia in late spring. Pine straw and mulch from $8 a bale installed. Irrigation repairs and spring start-ups from $85. Fall leaf cleanup from $225.",
    "No contracts: cancel weekly service anytime with a week's notice. We mulch clippings back into the lawn; bagging is $10 more a visit. You don't need to be home, just leave the gate unlocked. Aeration and overseeding for fescue is best from September to mid-October.",
    "Hours Mon–Fri 7 AM – 6 PM, Sat 8 AM – 1 PM. We work in Charlotte, Matthews, Mint Hill, Huntersville, Pineville and Fort Mill.",
    'Two customers said we could share: Jenna W. in Matthews, "Same two guys every Thursday for three years. I have not thought about my lawn since." And Robert D. in Huntersville, "Andre found the broken sprinkler zone that two other companies missed, and fixed it the same visit."',
    "(704) 555-0128, crew@greenline.example.com, Instagram https://instagram.example.com/greenlinecharlotte.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "home-services",
    design: {
      composition: "immersive",
      primaryAction: "quote",
      density: "balanced",
      imageTreatment: "natural",
    },
    business: {
      name: "Greenline Landscaping",
      category: "Landscaping & lawn care",
      phone: "(704) 555-0128",
      email: "crew@greenline.example.com",
      city: "Charlotte",
      state: "NC",
      serviceArea: "Charlotte, Matthews, Mint Hill, Huntersville, Pineville and Fort Mill",
      hours: [
        { days: "Mon–Fri", time: "7 AM – 6 PM" },
        { days: "Sat", time: "8 AM – 1 PM" },
      ],
      highlights: ["Licensed irrigation contractor", "No contracts", "Same crew every week"],
      links: { instagram: "https://instagram.example.com/greenlinecharlotte" },
    },
    theme: {
      // Verde-pinho como única cor de ação; palha só em fios e detalhes, nunca como texto.
      primary: "#2F5D34",
      secondary: "#D4A44C",
      background: "#F4F2EA",
      text: "#1A2419",
      font: "classic",
    },
    sections: [
      {
        type: "hero",
        title: "A Charlotte lawn that still looks good in August",
        subtitle:
          "Red clay, summer drought and fescue that browns out by July. We mow, plant and water around all three, with the same crew at your house every week.",
        ctaLabel: "Get a yard quote",
        imageQuery: "landscaper trimming hedge",
        image: {
          url: "/photos/landscaper.webp",
          alt: "A landscaper trimming a hedge",
          source: "unsplash",
          kind: "scene",
          credit: { name: "FRAEM GmbH", url: "https://unsplash.com/photos/rBY5Ek86oOI" },
          width: 2400,
          height: 1600,
          focus: "55% 50%",
        },
      },
      {
        type: "services",
        title: "Through the year",
        items: [
          {
            group: "Every week",
            name: "Weekly mowing",
            description:
              "Mow, edge, string-trim and blow off the driveway and walks. Clippings go back into the lawn.",
            detail: "March through November",
            price: "from $45 a visit",
          },
          {
            group: "Every week",
            name: "Shrub and hedge trimming",
            description: "Shrubs and hedges shaped twice a year, clippings hauled away.",
            detail: "Spring and late summer",
            price: "from $120",
          },
          {
            group: "Projects",
            name: "Landscape design and installs",
            description:
              "Kevin draws the plan for beds, plants and stone, and you get a fixed price before we dig.",
            detail: "Drawn plan first",
          },
          {
            group: "Projects",
            name: "Sod and seeding",
            description:
              "Fescue in the fall, Bermuda and zoysia in late spring, laid when the grass will take.",
          },
          {
            group: "Projects",
            name: "Pine straw and mulch",
            description: "Spread and tucked along beds, trees and borders.",
            price: "from $8 a bale",
          },
          {
            group: "Water and seasons",
            name: "Irrigation repairs and start-ups",
            description:
              "Broken heads, leaking valves and zones that stopped running, checked by a licensed irrigation contractor.",
            price: "from $85",
          },
          {
            group: "Water and seasons",
            name: "Fall leaf cleanup",
            description: "Leaves blown out of the beds and off the lawn, then hauled away.",
            price: "from $225",
          },
        ],
      },
      {
        type: "gallery",
        title: "Yards we look after",
        images: [
          work(
            1,
            "A freshly mowed lawn with even stripes, edged by tall shade trees",
            "01 · Weekly mowing",
            { name: "heipei", url: "https://www.flickr.com/photos/97859317@N00/25718450" },
            768,
          ),
          work(
            16,
            "Pink lilies and orange daylilies along a wooden picket fence, over a band of yellow flowers",
            "02 · Lily border along a fence",
            CWWYCOFF("3757274244"),
            685,
          ),
          work(
            15,
            "A brick patio with two wicker chairs, framed by planted beds and trimmed lawn",
            "03 · Patio beds and lawn edge",
            CWWYCOFF("3756462621"),
            685,
          ),
          work(
            14,
            "Trimmed lawn and planted edges around a small green garden shed with a brick pad",
            "04 · Lawn and beds around a garden shed",
            CWWYCOFF("3757246440"),
            685,
          ),
          work(
            13,
            "A raised bed of purple liatris and yellow coreopsis in front of a lattice screen",
            "05 · Raised perennial bed",
            CWWYCOFF("3756459353"),
            685,
          ),
        ],
      },
      {
        type: "about",
        title: "Two brothers and a borrowed trailer",
        body: "Andre and Kevin Simmons started Greenline in 2015 with one mower and a borrowed trailer. Andre handles the water side as a North Carolina licensed irrigation contractor, Kevin draws the designs and runs the install crew, and Brenda keeps the schedule so your crew shows up on the same day every week.",
        people: [
          {
            name: "Andre Simmons",
            role: "Co-owner, irrigation",
            note: "North Carolina licensed irrigation contractor.",
          },
          {
            name: "Kevin Simmons",
            role: "Co-owner, design and installs",
            note: "Draws every plan before the crew digs.",
          },
          { name: "Brenda Ortiz", role: "Schedule and billing" },
        ],
      },
      {
        type: "testimonials",
        title: "From the neighborhood",
        items: [
          {
            quote:
              "Same two guys every Thursday for three years. I have not thought about my lawn since.",
            author: "Jenna W., Matthews",
          },
          {
            quote:
              "Andre found the broken sprinkler zone that two other companies missed, and fixed it the same visit.",
            author: "Robert D., Huntersville",
          },
        ],
      },
      {
        type: "faq",
        title: "Before your first mow",
        items: [
          {
            q: "Do I have to sign a contract?",
            a: "No. Cancel weekly service anytime with a week's notice.",
          },
          {
            q: "Do you bag the clippings?",
            a: "We mulch them back into the lawn. If you'd rather have them bagged, it's $10 more a visit.",
          },
          {
            q: "Do I need to be home?",
            a: "No. Just leave the gate unlocked on your service day.",
          },
          {
            q: "When should I aerate and overseed fescue?",
            a: "In Charlotte, September to mid-October is the window.",
          },
          {
            q: "Do you work outside Charlotte?",
            a: "Yes: Matthews, Mint Hill, Huntersville, Pineville and Fort Mill.",
          },
        ],
      },
      {
        type: "contact",
        title: "Walk us through your yard",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
