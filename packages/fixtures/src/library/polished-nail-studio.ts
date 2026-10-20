import type { ModelEntry } from "./types";

// Modelo de estúdio de unhas (beleza, composição modular): blocos lado a lado com cardápio,
// horário e contato; foto de ambiente (esmalte, kind "scene") no bloco ao lado do título. Verde-azulado + pêssego (pêssego nunca como texto). Fatos: só os do `brief`.
export const polishedNailStudio: ModelEntry = {
  slug: "polished-nail-studio",
  category: "beauty",
  keywords: [
    "nail salon",
    "nail studio",
    "nails",
    "manicure",
    "pedicure",
    "gel manicure",
    "gel nails",
    "dip powder",
    "nail art",
    "gel-x",
    "acrylic",
    "nail tech",
  ],
  brief: [
    "Polished Nail Studio is a small nail studio at 1100 S Lamar Blvd, Suite 140 in Austin, TX. I'm Thao Nguyen, nail tech for 9 years, I opened Polished in 2020. Brianna Cole does structured gel and Gel-X, Mai Tran does pedicures.",
    "Prices: gel manicure $45 (45 min), structured gel manicure $60 (60 min, builder gel for weak or short nails), dip powder manicure $50 (60 min, no lamp needed), Gel-X extensions from $75 (90 min, soft gel tips in almond, coffin or square), nail art from $10 (simple accents to full hand-painted sets), classic pedicure $40 (40 min), spa pedicure $60 (60 min, scrub, mask and hot stones), gel removal $15 (free if you're getting a new set).",
    "Metal tools are cleaned and sterilized in an autoclave, files and buffers are new for every client. Pedicure bowls are pipeless and cleaned after every guest.",
    "Gel usually lasts 2 to 3 weeks. Bring inspiration photos for nail art. Book online at polished.example.com/book. 12 hours notice to cancel. Walk-ins only if there's an opening.",
    "Open Mon–Sat 10 AM – 7 PM, Sun 11 AM – 5 PM. Free parking in the lot behind the building.",
    'Clients said: "Brianna\'s structured gel is the first manicure that has lasted me three full weeks." (Lauren P.) and "I brought Thao a blurry screenshot and she painted it better than the original." (Dani R.)',
    "(512) 555-0126, hi@polishednails.example.com, instagram.example.com/polishedatx.",
    "Style: modern, playful",
  ].join("\n"),
  spec: {
    version: 1,
    template: "beauty",
    design: {
      composition: "modular",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Nail studio: a tidy grid of menu, hours and booking, like a well-run appointment book.",
    },
    business: {
      name: "Polished Nail Studio",
      category: "Nail salon",
      phone: "(512) 555-0126",
      email: "hi@polishednails.example.com",
      address: "1100 S Lamar Blvd, Suite 140",
      city: "Austin",
      state: "TX",
      serviceArea: "South Lamar, Austin",
      hours: [
        { days: "Mon–Sat", time: "10 AM – 7 PM" },
        { days: "Sun", time: "11 AM – 5 PM" },
      ],
      highlights: ["Autoclave-sterilized tools", "Free parking"],
      links: {
        booking: "https://polished.example.com/book",
        instagram: "https://instagram.example.com/polishedatx",
      },
    },
    theme: {
      primary: "#0F6E6A",
      secondary: "#F4B8A9",
      background: "#FFF8F5",
      text: "#1F2A2E",
      font: "gallery",
    },
    sections: [
      {
        type: "hero",
        title: "Gel that makes it to week three",
        subtitle:
          "Gel, structured gel, dip and hand-painted nail art on South Lamar. Sterilized tools, a new file for every client and free parking out back.",
        ctaLabel: "Book your nails",
        image: {
          url: "/photos/models/polished-nail-studio-8.webp",
          alt: "A drop of glossy red nail polish falling from the brush back into the bottle",
          source: "upload",
          kind: "scene",
          credit: {
            name: "spurekar",
            url: "https://www.flickr.com/photos/63324741@N04/25788709725",
          },
          width: 1024,
          height: 1024,
          focus: "50% 42%",
        },
      },
      {
        type: "services",
        title: "The menu",
        items: [
          {
            group: "Hands",
            name: "Gel manicure",
            description: "Shape, cuticle care and gel color in any shade on the wall.",
            price: "$45",
            detail: "45 min",
          },
          {
            group: "Hands",
            name: "Structured gel manicure",
            description: "A builder gel base that strengthens weak or short nails.",
            price: "$60",
            detail: "60 min",
          },
          {
            group: "Hands",
            name: "Dip powder manicure",
            description: "Dip color over your natural nails, no lamp needed.",
            price: "$50",
            detail: "60 min",
          },
          {
            group: "Hands",
            name: "Gel-X extensions",
            description: "Soft gel tips for length, shaped to almond, coffin or square.",
            price: "from $75",
            detail: "90 min",
          },
          {
            group: "Art & extras",
            name: "Nail art",
            description: "From simple accents to full hand-painted sets. Bring inspiration photos.",
            price: "from $10",
            detail: "Added to any set",
          },
          {
            group: "Art & extras",
            name: "Gel removal",
            description: "Gentle soak-off. Free if you're getting a new set.",
            price: "$15",
          },
          {
            group: "Feet",
            name: "Classic pedicure",
            description: "Soak, shape, cuticles and polish or gel.",
            price: "$40",
            detail: "40 min",
          },
          {
            group: "Feet",
            name: "Spa pedicure",
            description: "The classic, plus a scrub, a mask and hot stones.",
            price: "$60",
            detail: "60 min",
          },
        ],
      },
      {
        type: "faq",
        title: "Before you come in",
        items: [
          {
            q: "How long does gel last?",
            a: "Usually 2 to 3 weeks. Structured gel tends to hold best on short or weak nails.",
          },
          {
            q: "How do you keep things clean?",
            a: "Metal tools are cleaned and sterilized in an autoclave. Files and buffers are new for every client, and our pipeless pedicure bowls are cleaned after every guest.",
          },
          {
            q: "Can you remove gel from another salon?",
            a: "Yes. Removal is $15, or free if you're getting a new set with us.",
          },
          {
            q: "Do you take walk-ins?",
            a: "Only if there's an opening. Booking online is the surest way to get a spot.",
          },
          {
            q: "What's your cancellation policy?",
            a: "Please give us 12 hours' notice so we can offer the time to someone else.",
          },
        ],
      },
      {
        type: "about",
        title: "Who's at the table",
        body: "Thao Nguyen has been a nail tech for 9 years and opened Polished in 2020: a small studio on South Lamar where every set gets the time it needs. Bring a photo, a color, or no idea at all.",
        people: [
          { name: "Thao Nguyen", role: "Owner, nail tech", note: "Hand-painted nail art." },
          { name: "Brianna Cole", role: "Nail tech", note: "Structured gel and Gel-X." },
          { name: "Mai Tran", role: "Nail tech", note: "Pedicures." },
        ],
      },
      {
        type: "testimonials",
        title: "Fresh off the table",
        items: [
          {
            quote:
              "Brianna's structured gel is the first manicure that has lasted me three full weeks.",
            author: "Lauren P.",
          },
          {
            quote:
              "I brought Thao a blurry screenshot and she painted it better than the original.",
            author: "Dani R.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a set",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
