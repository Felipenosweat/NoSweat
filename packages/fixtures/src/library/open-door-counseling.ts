import type { ModelEntry } from "./types";

// Modelo profissional "immersive": consultório de terapia. Sem foto (o topo vira o palco escuro
// só com o texto, calmo). Sem depoimentos de propósito: códigos de ética de terapeutas não
// permitem pedir depoimento a clientes. Saúde mental: nenhuma promessa de resultado, e a linha
// de crise (988) aparece porque o dono pediu.
export const openDoorCounseling: ModelEntry = {
  slug: "open-door-counseling",
  category: "professional",
  keywords: [
    "therapy",
    "therapist",
    "counseling",
    "counselor",
    "psychotherapy",
    "mental health",
    "couples therapy",
    "marriage counseling",
    "anxiety",
    "depression",
    "grief",
    "telehealth",
    "online therapy",
  ],
  brief: [
    "Open Door Counseling is a small therapy practice at 3518 Fremont Ave N, Suite 210 in Fremont, Seattle, WA. Three licensed therapists, and on the free call we help you choose: Hannah Sato, LMHC, founded the practice and works with anxiety, burnout and life transitions; David Okoro, LMFT, works with couples and has Gottman Method Level 2 training; Priya Raman, LICSW, works with grief and postpartum depression.",
    "Individual therapy $170 for 50 minutes, couples therapy $220 for 80 minutes, and a free 15-minute phone consultation before you book anything so you can see if we're a fit. We keep a few sliding-scale spots from $90. In network with Premera and Regence; for other plans we give you a superbill to send to your insurance.",
    "Sessions in person in Fremont or by telehealth for anyone located in Washington, same fees and same therapists. Most people come weekly at first, then every other week; you decide that with your therapist. Nobody has to have the words ready for the first session; we start with what brought you in.",
    "Open Mon–Thu 8 AM – 8 PM, Fri 8 AM – 3 PM. Book a free consultation at opendoorcounseling.example.com/consult.",
    "We are not a crisis service. If you are in crisis, call or text 988.",
    "(206) 555-0182, hello@opendoorcounseling.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "professional",
    design: {
      composition: "immersive",
      primaryAction: "book",
      density: "balanced",
      imageTreatment: "natural",
      rationale:
        "Therapy practice: a quiet dark stage with one sentence, warm clay and sage, fees and the free call stated plainly.",
    },
    business: {
      name: "Open Door Counseling",
      category: "Therapy practice",
      phone: "(206) 555-0182",
      email: "hello@opendoorcounseling.example.com",
      address: "3518 Fremont Ave N, Suite 210",
      city: "Seattle",
      state: "WA",
      serviceArea: "Fremont, Seattle, and telehealth anywhere in Washington",
      hours: [
        { days: "Mon–Thu", time: "8 AM – 8 PM" },
        { days: "Fri", time: "8 AM – 3 PM" },
      ],
      highlights: ["Free 15-minute consultation", "In person or telehealth"],
      links: { booking: "https://opendoorcounseling.example.com/consult" },
    },
    theme: {
      primary: "#A4553A",
      secondary: "#8FA08A",
      background: "#F5F1EA",
      text: "#26302C",
      font: "luxe",
    },
    sections: [
      {
        type: "hero",
        title: "You don't have to have the words yet.",
        subtitle:
          "Therapy for anxiety, burnout, grief and couples, in Fremont or by telehealth anywhere in Washington. Start with a free 15-minute call.",
        ctaLabel: "Book a free consultation",
        imageQuery: "quiet room soft window light",
      },
      {
        type: "about",
        title: "How it starts",
        body: "First, a free 15-minute phone call to see if we're a fit, before you book anything. Then your first session, in person in Fremont or by telehealth. Nobody has to have the words ready; we start with what brought you in.\n\nMost people come weekly at first, then every other week.",
      },
      {
        type: "services",
        title: "Sessions and fees",
        items: [
          {
            name: "Individual therapy",
            description:
              "For anxiety, burnout, life transitions, grief and postpartum depression. In person or by telehealth.",
            price: "$170",
            detail: "50 minutes",
          },
          {
            name: "Couples therapy",
            description:
              "With David Okoro, LMFT, who has Gottman Method Level 2 training. For couples who keep having the same argument, or have stopped having any.",
            price: "$220",
            detail: "80 minutes",
          },
          {
            name: "Telehealth",
            description:
              "The same sessions by video, for anyone located in Washington. Same fees, same therapists.",
            detail: "Anywhere in Washington",
          },
          {
            name: "Free phone consultation",
            description: "Fifteen minutes to ask questions and see if we're a fit.",
            price: "Free",
            detail: "15 minutes",
          },
          {
            name: "Sliding-scale spots",
            description: "We keep a few reduced-fee spots. Ask on the consultation call.",
            price: "from $90",
            detail: "Limited",
          },
        ],
      },
      {
        type: "about",
        title: "Who you'll work with",
        body: "Three licensed therapists, each with a focus. On the free call we'll help you choose.",
        people: [
          {
            name: "Hannah Sato, LMHC",
            role: "Founder",
            note: "Anxiety, burnout and life transitions.",
          },
          {
            name: "David Okoro, LMFT",
            role: "Couples therapist",
            note: "Couples work, with Gottman Method Level 2 training.",
          },
          {
            name: "Priya Raman, LICSW",
            role: "Therapist",
            note: "Grief and postpartum depression.",
          },
        ],
      },
      {
        type: "faq",
        title: "Questions people ask before the first call",
        items: [
          {
            q: "Do you take insurance?",
            a: "We're in network with Premera and Regence. For other plans we give you a superbill to send to your insurance.",
          },
          {
            q: "Can I do every session by telehealth?",
            a: "Yes, if you're located in Washington during the session. Same fees and the same therapists as in person.",
          },
          {
            q: "How often will we meet?",
            a: "Most people come weekly at first, then every other week. You decide together with your therapist.",
          },
          {
            q: "What if I can't afford the full fee?",
            a: "We keep a few sliding-scale spots from $90. Ask about them on the free consultation call.",
          },
          {
            q: "What if I'm in crisis right now?",
            a: "We are not a crisis service. If you are in crisis, call or text 988.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a free consultation",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
