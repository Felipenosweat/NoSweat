import type { SiteImage, SiteSpec } from "@nosweat/schema";

// Modelo de portfólio (ver docs/design/model-sites.md). Fatos: briefs.ts.
// As fotos fazem o papel das fotos da dona (kind "owner") num negócio fictício; vêm da Unsplash,
// com crédito visível, e só aparecem no /examples.
// TODO(verificar): este ambiente não acessa a Unsplash. Conferir cada foto (existe, mostra um
// casamento) e trocar o crédito genérico pelo nome e pela página do fotógrafo antes de mostrar.

/** Crédito provisório (ver TODO acima): nunca atribuir a foto a um nome não conferido. */
const PENDING_CREDIT = {
  name: "Unsplash contributor",
  url: "https://unsplash.com/s/photos/wedding",
};

/** Foto vertical (4:5) cortada pela própria Unsplash, com o tamanho conhecido. */
function work(id: string, alt: string, caption: string): SiteImage {
  return {
    url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=1500&q=80`,
    alt,
    source: "unsplash",
    kind: "owner",
    credit: PENDING_CREDIT,
    width: 1200,
    height: 1500,
    caption,
  };
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
      image: {
        url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&h=1350&q=80",
        alt: "A couple holding each other on their wedding day",
        source: "unsplash",
        kind: "owner",
        credit: PENDING_CREDIT,
        width: 2400,
        height: 1350,
      },
    },
    {
      type: "gallery",
      title: "Recent weddings",
      images: [
        work(
          "1511285560929-80b456fea0bc",
          "A bride and groom outdoors",
          "Ana & Luis · Biltmore Estate · 2025",
        ),
        work(
          "1465495976277-4387d4b0b4c6",
          "A couple walking together after the ceremony",
          "Grace & Owen · Blue Ridge Parkway · 2025",
        ),
        work(
          "1606800052052-a08af7148866",
          "Wedding details before the ceremony",
          "Priya & Sam · Downtown Asheville · 2024",
        ),
        work(
          "1522673607200-164d1b6ce486",
          "A couple sharing a quiet moment",
          "Hannah & Theo · A backyard in Weaverville · 2024",
        ),
        work(
          "1583939003579-730e3918a45a",
          "A bride getting ready",
          "Lucía & Dan · Biltmore Estate · 2024",
        ),
        work(
          "1537633552985-df8429e8048b",
          "Newlyweds outside after the ceremony",
          "Maya & Jordan · Black Mountain · 2024",
        ),
        work(
          "1591604466107-ec97de577aff",
          "A couple during their first dance",
          "Elena & Chris · River Arts District · 2023",
        ),
        work(
          "1525258946800-98cfd641d0de",
          "Guests celebrating at a wedding",
          "Rosa & Ben · Blue Ridge Parkway · 2023",
        ),
      ],
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
