import type { ModelEntry } from "./types";

// Modelo de portfólio: filmes de casamento e de marca em Minneapolis (composição "modular").
// Tema escuro de cinema (fundo grafite, âmbar como única cor de ação). Uma foto no topo (câmera
// gravando uma entrevista; kind "owner", papel de foto do estúdio; Flickr, CC BY-SA 2.0, crédito
// em `credit`; recortada só para tirar a borda branca do original). Sem galeria: o lote não tinha
// 3 fotos boas (rostos de perto, marcas de câmera, marca d'água ou licença ND). Os trabalhos
// recentes ficam no "about". Todo fato do site está no brief (regra 8).
export const reelNorthFilms: ModelEntry = {
  slug: "reel-north-films",
  category: "portfolio",
  keywords: [
    "videographer",
    "videography",
    "wedding video",
    "wedding film",
    "filmmaker",
    "brand video",
    "video production",
    "elopement film",
    "commercial video",
    "drone",
    "highlight film",
  ],
  brief: [
    "Reel North Films is a husband-and-wife film studio in Minneapolis, MN. I'm Ingrid Solberg, I direct and edit; my husband Nate Solberg shoots and records audio. We've filmed weddings since 2018 and brand videos since 2020. We take about 25 weddings a year.",
    "We record the vows, the toasts and the speeches with real audio, so our films sound like the day, not a music video.",
    "Weddings: elopement film $1,900 (up to 3 hours, 3–4 minute film), highlight film from $3,400 (6 hours, 5–7 minute film), feature film from $5,200 (10 hours, two filmmakers, 20–30 minute film plus the full ceremony and toasts). Brand: brand story from $4,500 (one shoot day, a 2–3 minute film and 3 short cutdowns), social package $1,200 (half day, 6 vertical clips).",
    "Wedding films are delivered within 10 weeks, brand videos in 3–4 weeks. A 30% retainer holds the date. Travel in Minnesota and Wisconsin is included. Now booking 2027 dates.",
    "Recent work: Hannah & Ike at Mill City Museum (2025), Sofia & Dev at a cabin on Lake Vermilion (2025), a brand film for Northbound Coffee Roasters (2025) and a recruiting film for Halvorsen Builders (2024).",
    'Clients wrote: "We\'ve watched it eleven times. My dad\'s toast still gets me every time." (Hannah & Ike) and "Three weeks from shoot day to a film we put on our homepage and in every store." (Jen Alvarez, Northbound Coffee Roasters)',
    "(612) 555-0158, hello@reelnorth.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "portfolio",
    design: {
      composition: "modular",
      primaryAction: "quote",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Two filmmakers selling weddings and brand work: a dark, cinematic bento with packages side by side.",
    },
    business: {
      name: "Reel North Films",
      category: "Wedding & brand videographer",
      phone: "(612) 555-0158",
      email: "hello@reelnorth.example.com",
      city: "Minneapolis",
      state: "MN",
      serviceArea: "Minneapolis–St. Paul, Minnesota and Wisconsin",
      highlights: [
        "Now booking 2027 dates",
        "Real audio from vows & toasts",
        "Travel in MN & WI included",
      ],
    },
    theme: {
      primary: "#E8B04B",
      secondary: "#5C7A89",
      background: "#101418",
      text: "#ECEFF1",
      font: "modern",
    },
    sections: [
      {
        type: "hero",
        title: "Wedding films with the sound left in",
        subtitle:
          "We record the vows, the toasts and the speeches with real audio, so the film sounds like the day, not a music video. Weddings and brand films from Minneapolis.",
        ctaLabel: "Check your date",
        image: {
          url: "/photos/models/reel-north-films-2.webp",
          alt: "A video camera recording a seated interview, the subject framed on its flip-out screen",
          source: "upload",
          kind: "owner",
          credit: {
            name: "jsawkins",
            url: "https://www.flickr.com/photos/89589444@N00/4203341678",
          },
          width: 986,
          height: 564,
          focus: "30% 50%",
        },
      },
      {
        type: "services",
        title: "Packages",
        items: [
          {
            name: "Feature film",
            description:
              "Two filmmakers from getting ready to the send-off. A 20–30 minute film plus the full ceremony and toasts.",
            price: "from $5,200",
            detail: "10 hours",
            group: "Weddings",
          },
          {
            name: "Highlight film",
            description: "The day cut to a 5–7 minute film, with the vows and toasts in it.",
            price: "from $3,400",
            detail: "6 hours",
            group: "Weddings",
          },
          {
            name: "Elopement film",
            description: "Just the two of you, or a few guests. A 3–4 minute film.",
            price: "$1,900",
            detail: "Up to 3 hours",
            group: "Weddings",
          },
          {
            name: "Brand story",
            description:
              "One shoot day, a 2–3 minute film about the people behind the business and 3 short cutdowns.",
            price: "from $4,500",
            detail: "Delivered in 3–4 weeks",
            group: "Brand",
          },
          {
            name: "Social package",
            description: "Half a day on location and 6 vertical clips ready to post.",
            price: "$1,200",
            detail: "Half day",
            group: "Brand",
          },
        ],
      },
      {
        type: "about",
        title: "Ingrid and Nate",
        body: "We're a husband-and-wife studio: weddings since 2018, brand videos since 2020, about 25 weddings a year.\n\nRecent work: Hannah & Ike at Mill City Museum (2025), Sofia & Dev at a cabin on Lake Vermilion (2025), a brand film for Northbound Coffee Roasters (2025) and a recruiting film for Halvorsen Builders (2024).",
        people: [
          { name: "Ingrid Solberg", role: "Director & editor" },
          { name: "Nate Solberg", role: "Camera & audio" },
        ],
      },
      {
        type: "testimonials",
        title: "After the premiere",
        items: [
          {
            quote: "We've watched it eleven times. My dad's toast still gets me every time.",
            author: "Hannah & Ike",
          },
          {
            quote:
              "Three weeks from shoot day to a film we put on our homepage and in every store.",
            author: "Jen Alvarez, Northbound Coffee Roasters",
          },
        ],
      },
      {
        type: "faq",
        title: "Working together",
        items: [
          {
            q: "When do we get our film?",
            a: "Wedding films within 10 weeks. Brand videos in 3–4 weeks.",
          },
          {
            q: "How do we hold our date?",
            a: "A 30% retainer holds it. We're now booking 2027 dates.",
          },
          {
            q: "Do you travel?",
            a: "Travel in Minnesota and Wisconsin is included. Farther than that, ask us.",
          },
          {
            q: "Is there music, or real sound?",
            a: "Both. We record the vows, the toasts and the speeches with real audio and build the film around them.",
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
  },
};
