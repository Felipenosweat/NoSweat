import type { SiteImage, SiteSpec } from "@nosweat/schema";
import { MODEL_UNSPLASH_PHOTOS } from "./unsplash-photos";

// Modelo de portfólio (ver docs/design/model-sites.md). Fatos: briefs.ts.
// As fotos fazem o papel das fotos da dona (kind "owner") num negócio fictício. Vêm do conjunto
// verificado em unsplash-photos.ts (existem, mostram casamentos, com o crédito de cada fotógrafo) e
// só aparecem no /examples. Os nomes dos casais e os lugares das legendas são fictícios.

const verified = MODEL_UNSPLASH_PHOTOS["vega-photo"];
if (!verified) throw new Error("vega-photo: fotos verificadas não encontradas");

const CAPTIONS = [
  "Ana & Luis · Biltmore Estate · 2025",
  "Grace & Owen · Blue Ridge Parkway · 2025",
  "Hannah & Theo · Weaverville · 2024",
  "Maya & Jordan · Black Mountain · 2024",
  "Lucía & Dan · Biltmore Estate · 2023",
];

/** Foto do conjunto verificado, com a legenda "casal · lugar · ano". */
function work(index: number): SiteImage {
  const image = verified?.gallery[index];
  if (!image) throw new Error(`vega-photo: falta a foto ${index}`);
  return { ...image, caption: CAPTIONS[index] };
}

export const vegaPhoto: SiteSpec = {
  version: 1,
  template: "portfolio",
  design: {
    composition: "editorial",
    primaryAction: "browse",
    density: "airy",
    imageTreatment: "natural",
  },
  business: {
    name: "Marisol Vega Photography",
    category: "Wedding photographer",
    phone: "(828) 555-0119",
    email: "hello@marisolvega.example.com",
    city: "Asheville",
    state: "NC",
    serviceArea: "Asheville and western North Carolina",
  },
  theme: {
    primary: "#121212",
    secondary: "#A4532E",
    background: "#FAFAF8",
    text: "#121212",
    font: "gallery",
  },
  sections: [
    {
      type: "hero",
      title: "Wedding photography in Asheville and the Blue Ridge",
      subtitle:
        "I photograph weddings and elopements as they happen, without posing anyone. I take about 20 weddings a year, so I answer every email myself.",
      ctaLabel: "Check your date",
      image: verified.hero,
    },
    {
      type: "gallery",
      title: "Recent weddings",
      images: [work(0), work(1), work(2), work(3), work(4)],
    },
    {
      type: "services",
      title: "Packages",
      items: [
        {
          name: "Elopement",
          description: "Just the two of you, or a few guests, anywhere in the mountains.",
          price: "from $1,800",
          detail: "Up to 3 hours",
        },
        {
          name: "Full wedding day",
          description: "From getting ready to the last dance, with a second photographer.",
          price: "from $4,200",
          detail: "8 hours",
        },
        {
          name: "Engagement portraits",
          description: "An hour together at a place the two of you pick.",
          price: "$450",
          detail: "1 hour",
        },
      ],
    },
    {
      type: "about",
      title: "About",
      body: "I'm Marisol, and I've photographed weddings and elopements across western North Carolina since 2016. I stay out of the way and photograph what happens, at the Biltmore Estate or in a backyard. Every couple gets an online gallery of edited photos within 6 weeks, and travel within 2 hours of Asheville is included.",
    },
    {
      type: "testimonials",
      items: [
        {
          quote: "We forgot Marisol was there, and then we saw the photos.",
          author: "Ana & Luis",
        },
        {
          quote: "She caught every face during the toasts, even the ones we missed.",
          author: "Grace & Owen",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          q: "When will we get our photos?",
          a: "Within 6 weeks, in an online gallery you can share and download from.",
        },
        {
          q: "Do you travel?",
          a: "Travel within 2 hours of Asheville is included. Farther than that, ask me.",
        },
        {
          q: "Is a second photographer included?",
          a: "Yes, on the full wedding day package.",
        },
      ],
    },
    {
      type: "contact",
      title: "Check your date",
      showForm: true,
      showMap: false,
    },
  ],
};
