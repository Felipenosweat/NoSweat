import type { ModelEntry } from "./types";

// Modelo de spa e massagem (beleza, composição imersiva). O topo usa uma foto de ambiente (toalha
// e suculentas, kind "scene"), sem pessoas. Sálvia + areia, fonte "luxe". Fatos: só os do `brief`.
export const stillWaterSpa: ModelEntry = {
  slug: "still-water-spa",
  category: "beauty",
  keywords: [
    "spa",
    "day spa",
    "massage",
    "massage therapist",
    "deep tissue",
    "swedish massage",
    "hot stone",
    "prenatal massage",
    "couples massage",
    "facial",
    "esthetician",
    "wellness",
  ],
  brief: [
    "Still Water Spa is a quiet day spa at 7134 E Stetson Dr, Suite 2 in Old Town Scottsdale, AZ. I'm Renee Calloway, a licensed massage therapist in Arizona, and I opened Still Water in 2015. Marcus Bell is also a licensed massage therapist and does sports and deep tissue work. Hannah Pierce is our licensed esthetician and does all the facials.",
    "Five treatment rooms, one of them a couples suite with two tables side by side. No phones in the treatment rooms, no music unless you ask for it.",
    "Prices: Swedish massage $110 (60 min) or $155 (90 min), deep tissue massage $125 (60 min) or $175 (90 min), hot stone massage $165 (90 min), prenatal massage $120 (60 min, after the first trimester, side-lying and fully supported), signature facial $130 (60 min, cleanse, extractions, mask), express facial $85 (30 min), couples massage $240 (60 min, side by side), couples retreat $340 (90 min, massage plus a facial mask and tea in the couples suite).",
    "Please arrive 15 minutes early to fill out a short health form. 24 hours notice to cancel or we charge half the service. Gratuity is not included. Gift cards at the front desk and online.",
    "Open daily 9 AM – 8 PM. Book online at stillwater.example.com/book. Free parking in the lot on Stetson.",
    'Guests wrote: "Marcus found the knot in my shoulder that three other therapists missed." (Rachel D.) and "We booked the couples retreat for our anniversary and didn\'t say a word for ninety minutes, in the best way." (Chris & Mia L.)',
    "(480) 555-0171, rest@stillwaterspa.example.com.",
    "Style: calm, luxurious",
  ].join("\n"),
  spec: {
    version: 1,
    template: "beauty",
    design: {
      composition: "immersive",
      primaryAction: "book",
      density: "airy",
      imageTreatment: "natural",
      rationale: "Day spa: an immersive, slow page with a lot of air; the quiet is the product.",
    },
    business: {
      name: "Still Water Spa",
      category: "Day spa",
      phone: "(480) 555-0171",
      email: "rest@stillwaterspa.example.com",
      address: "7134 E Stetson Dr, Suite 2",
      city: "Scottsdale",
      state: "AZ",
      serviceArea: "Old Town Scottsdale",
      hours: [{ days: "Daily", time: "9 AM – 8 PM" }],
      highlights: ["Licensed massage therapists", "Couples suite", "Free parking"],
      links: { booking: "https://stillwater.example.com/book" },
    },
    theme: {
      primary: "#5B6B4E",
      secondary: "#C8B79A",
      background: "#F5F2EC",
      text: "#2A2C26",
      font: "luxe",
    },
    sections: [
      {
        type: "hero",
        title: "An hour where nobody needs anything from you",
        subtitle:
          "Massage and facials in Old Town Scottsdale. Five quiet rooms, no phones, no music unless you ask for it, and licensed therapists who listen before they start.",
        ctaLabel: "Book a treatment",
        image: {
          url: "/photos/models/still-water-spa-9.webp",
          alt: "A rolled white towel and two small potted succulents on a warm wooden table",
          source: "upload",
          kind: "scene",
          credit: {
            name: "wellness_photos",
            url: "https://www.flickr.com/photos/130100316@N04/16161105698",
          },
          width: 1024,
          height: 683,
        },
      },
      {
        type: "about",
        title: "The rooms and the hands",
        body: "Renee Calloway opened Still Water on Stetson Drive in 2015 with one idea: the quiet is part of the treatment. There are five treatment rooms, one of them a couples suite with two tables side by side. No phones in the rooms, and no music unless you ask for it.",
        people: [
          {
            name: "Renee Calloway",
            role: "Owner, licensed massage therapist",
            note: "Licensed in Arizona. Swedish, hot stone and prenatal massage.",
          },
          {
            name: "Marcus Bell",
            role: "Licensed massage therapist",
            note: "Sports and deep tissue work.",
          },
          {
            name: "Hannah Pierce",
            role: "Licensed esthetician",
            note: "All of our facials.",
          },
        ],
      },
      {
        type: "services",
        title: "Treatments",
        items: [
          {
            group: "Massage",
            name: "Swedish massage",
            description: "Long, even pressure to slow everything down.",
            price: "$110 / $155",
            detail: "60 / 90 min",
          },
          {
            group: "Massage",
            name: "Deep tissue massage",
            description: "Slow, firm work on the knots that don't let go on their own.",
            price: "$125 / $175",
            detail: "60 / 90 min",
          },
          {
            group: "Massage",
            name: "Hot stone massage",
            description: "Warm stones and long Swedish strokes.",
            price: "$165",
            detail: "90 min",
          },
          {
            group: "Massage",
            name: "Prenatal massage",
            description: "Side-lying and fully supported, after the first trimester.",
            price: "$120",
            detail: "60 min",
          },
          {
            group: "Facials",
            name: "Signature facial",
            description: "Cleanse, extractions and a mask chosen for your skin that day.",
            price: "$130",
            detail: "60 min",
          },
          {
            group: "Facials",
            name: "Express facial",
            description: "A cleanse and mask for a lunch break.",
            price: "$85",
            detail: "30 min",
          },
          {
            group: "Together",
            name: "Couples massage",
            description: "Two tables side by side in the couples suite.",
            price: "$240",
            detail: "60 min",
          },
          {
            group: "Together",
            name: "Couples retreat",
            description: "Massage, then a facial mask and tea together in the couples suite.",
            price: "$340",
            detail: "90 min",
          },
        ],
      },
      {
        type: "testimonials",
        title: "Afterward",
        items: [
          {
            quote: "Marcus found the knot in my shoulder that three other therapists missed.",
            author: "Rachel D.",
          },
          {
            quote:
              "We booked the couples retreat for our anniversary and didn't say a word for ninety minutes, in the best way.",
            author: "Chris & Mia L.",
          },
        ],
      },
      {
        type: "faq",
        title: "Before your visit",
        items: [
          {
            q: "When should I arrive?",
            a: "15 minutes early, so you can fill out a short health form and settle in before your time starts.",
          },
          {
            q: "Can I have a massage while pregnant?",
            a: "Yes, after the first trimester. Book the prenatal massage and Renee will set you up side-lying with full support.",
          },
          {
            q: "What is your cancellation policy?",
            a: "Please give us 24 hours' notice. Later cancellations are charged half the service.",
          },
          {
            q: "Is gratuity included?",
            a: "No, gratuity is not included in our prices.",
          },
          {
            q: "Do you sell gift cards?",
            a: "Yes, at the front desk and online.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book your time",
        showForm: true,
        showMap: true,
      },
    ],
  },
};
