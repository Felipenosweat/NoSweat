import type { ModelEntry } from "./types";

// Modelo profissional "modular": consultório odontológico de família. Grade de blocos com
// horário e ligar no topo, preços para quem não tem plano e a lista de convênios aceitos (só os
// que o dono citou). Uma foto de cena só (detalhe de escova, sem pessoas): não há foto do
// consultório, e banco de imagens não pode virar "nossa equipe". Saúde: nada de promessa de
// resultado nem "sem dor".
export const baysideFamilyDental: ModelEntry = {
  slug: "bayside-family-dental",
  category: "professional",
  keywords: [
    "dentist",
    "dental",
    "family dentist",
    "dental office",
    "teeth cleaning",
    "fillings",
    "teeth whitening",
    "pediatric dentist",
    "kids dentist",
    "emergency dentist",
    "toothache",
    "hygienist",
  ],
  brief: [
    "Bayside Family Dental is a family dental office at 3410 W Bay to Bay Blvd in South Tampa, Tampa, FL. I'm Dr. Nadia Brooks, DMD, and I opened the practice in 2015. Dr. Marcus Lee, DDS, sees most of our kids and nervous patients, and Tasha Rivera, RDH, is our hygienist.",
    "We see kids from their first tooth; early visits are short and mostly about getting comfortable with the chair. We're a small office, so you see the same faces every visit. Cleanings and checkups, tooth-colored fillings, in-office and take-home whitening (we check your teeth before any whitening), and emergency visits for toothaches and broken teeth. If you call before noon with a toothache we try to see you that day.",
    "Without insurance: new patient exam, cleaning and x-rays $189, kids' cleaning and exam $95, tooth-colored fillings from $160, in-office whitening $395 (90 minutes), take-home whitening trays $250, emergency exam $125.",
    "We're in network with Delta Dental PPO, Cigna DPPO, MetLife, Aetna PPO, Guardian and United Concordia, and we file the claim for you. Not on the list? Call us and we'll check your plan.",
    "Open Mon, Tue and Thu 8 AM – 5 PM, Wed 10 AM – 7 PM, Fri 8 AM – 2 PM. Book online at baysidefamilydental.example.com/book.",
    'Patients said: "My son used to cry in the parking lot. Dr. Lee let him hold the mirror and now he asks when his next visit is." (Jenna K.) and "I chipped a tooth on a Thursday morning and was fixed by lunch." (Robert M.)',
    "(813) 555-0164, smile@baysidefamilydental.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "professional",
    design: {
      composition: "modular",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Family dental office: friendly bento grid with hours and call up top, clear prices and the insurance list.",
    },
    business: {
      name: "Bayside Family Dental",
      category: "Family dentist",
      phone: "(813) 555-0164",
      email: "smile@baysidefamilydental.example.com",
      address: "3410 W Bay to Bay Blvd",
      city: "Tampa",
      state: "FL",
      serviceArea: "South Tampa",
      hours: [
        { days: "Mon, Tue, Thu", time: "8 AM – 5 PM" },
        { days: "Wed", time: "10 AM – 7 PM" },
        { days: "Fri", time: "8 AM – 2 PM" },
      ],
      highlights: ["Kids from their first tooth", "We file the insurance claim"],
      links: { booking: "https://baysidefamilydental.example.com/book" },
    },
    theme: {
      primary: "#0E6B63",
      secondary: "#F4C38B",
      background: "#F3F8F6",
      text: "#10302E",
      font: "friendly",
    },
    sections: [
      {
        type: "hero",
        title: "From first tooth to last checkup, one dental office for the whole family.",
        subtitle:
          "Cleanings, fillings and whitening in South Tampa. Toothache? Call before noon and we try to see you that day. Open until 7 PM on Wednesdays.",
        ctaLabel: "Book a visit",
        imageQuery: "bright dental office chair",
        image: {
          url: "/photos/models/bayside-family-dental-11.webp",
          alt: "Close-up of a toothbrush head with teal and green bristles on a clean white background",
          source: "upload",
          kind: "scene",
          credit: { name: "wwarby", url: "https://www.flickr.com/photos/26782864@N00/11693522135" },
          width: 1023,
          height: 678,
          focus: "66% 50%",
        },
      },
      {
        type: "services",
        title: "Visits and prices",
        items: [
          {
            name: "New patient exam, cleaning and x-rays",
            description:
              "Your first visit with us: a full exam with Dr. Brooks, a cleaning with Tasha and the x-rays we need to see what's going on.",
            price: "$189",
            detail: "Without insurance",
            group: "Checkups",
          },
          {
            name: "Kids' cleaning and exam",
            description:
              "From the first tooth. Dr. Lee goes slowly, explains every tool and lets them hold the mirror.",
            price: "$95",
            detail: "Without insurance",
            group: "Checkups",
          },
          {
            name: "Tooth-colored fillings",
            description: "Cavities filled with material matched to your tooth, not silver.",
            price: "from $160",
            detail: "Per tooth",
            group: "Repairs",
          },
          {
            name: "Emergency exam",
            description:
              "Toothache, a broken or chipped tooth. Call before noon and we try to see you that day.",
            price: "$125",
            detail: "Call before noon",
            group: "Repairs",
          },
          {
            name: "In-office whitening",
            description: "One visit in the chair, with your teeth checked first.",
            price: "$395",
            detail: "90 minutes",
            group: "Whitening",
          },
          {
            name: "Take-home whitening trays",
            description: "Trays made for your teeth, to whiten at home on your own schedule.",
            price: "$250",
            detail: "Trays and gel",
            group: "Whitening",
          },
        ],
      },
      {
        type: "about",
        title: "Who you'll see",
        body: "Bayside Family Dental opened in South Tampa in 2015. It's a small office, so you see the same faces every visit, and your kids get to know us by name.",
        people: [
          {
            name: "Dr. Nadia Brooks, DMD",
            role: "Dentist and owner",
            note: "Opened the practice in 2015.",
          },
          {
            name: "Dr. Marcus Lee, DDS",
            role: "Dentist",
            note: "Sees most of our kids and our nervous patients.",
          },
          {
            name: "Tasha Rivera, RDH",
            role: "Dental hygienist",
            note: "Does the cleanings.",
          },
        ],
      },
      {
        type: "testimonials",
        title: "From our patients",
        items: [
          {
            quote:
              "My son used to cry in the parking lot. Dr. Lee let him hold the mirror and now he asks when his next visit is.",
            author: "Jenna K.",
          },
          {
            quote: "I chipped a tooth on a Thursday morning and was fixed by lunch.",
            author: "Robert M.",
          },
        ],
      },
      {
        type: "faq",
        title: "Insurance and first visits",
        items: [
          {
            q: "Which insurance do you take?",
            a: "We're in network with Delta Dental PPO, Cigna DPPO, MetLife, Aetna PPO, Guardian and United Concordia, and we file the claim for you. Not on the list? Call us and we'll check your plan.",
          },
          {
            q: "What if I don't have dental insurance?",
            a: "Our prices are listed above: $189 for a new patient exam, cleaning and x-rays, and $95 for a kids' cleaning and exam.",
          },
          {
            q: "When should my child first see a dentist?",
            a: "We see kids from their first tooth. Early visits are short and mostly about getting comfortable with the chair.",
          },
          {
            q: "I have a toothache. Can you see me today?",
            a: "Call before noon and we try to see you that day. The emergency exam is $125.",
          },
          {
            q: "Do you have evening hours?",
            a: "On Wednesdays we're open until 7 PM. The rest of the week: Mon, Tue and Thu 8 AM – 5 PM, Fri 8 AM – 2 PM.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a visit",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
