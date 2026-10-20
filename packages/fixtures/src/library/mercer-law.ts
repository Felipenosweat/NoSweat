import type { ModelEntry } from "./types";

// Modelo profissional "editorial": escritório pequeno de direito de família e sucessões.
// Sem foto de propósito (a composição editorial vive de tipografia). Sem depoimentos: regras de
// publicidade de advogados em Ohio pedem cuidado, e o dono não deu nenhum. Nada de promessa de
// resultado (direito): só o que o dono disse sobre preço, prazo e processo.
export const mercerLaw: ModelEntry = {
  slug: "mercer-law",
  category: "professional",
  keywords: [
    "lawyer",
    "attorney",
    "law firm",
    "law office",
    "estate planning",
    "wills",
    "trusts",
    "probate",
    "family law",
    "divorce",
    "power of attorney",
    "prenup",
  ],
  brief: [
    "Mercer Law is my small family and estate law office at 588 S Third St in German Village, Columbus, OH. I'm Ellen Mercer, admitted to the Ohio bar in 2006; I opened the office in 2013. Ruth Okafor is our paralegal and she prepares every document and runs the signing meetings. You meet with me at the start, and nobody hands your file to someone you've never met.",
    "Flat fees, quoted in writing before we start: a will package for $1,450 (will, financial power of attorney, health care power of attorney and living will), a revocable living trust package from $3,200, an estate plan review $350, prenuptial agreements from $1,800. Probate and estate administration is $285 an hour, or a flat quote once I've seen the estate. Divorce and dissolution consultations are $200 for 60 minutes, and that is credited if you hire us.",
    "How it works: a first meeting to talk through your family and what you own, drafts in about two weeks, then a signing meeting here with witnesses and a notary. I can't promise a result in any case; I tell you plainly what Ohio law says and what each option costs.",
    "Open Mon–Thu 9 AM – 5 PM, Fri 9 AM – 1 PM, Tuesday evening appointments by request. Book a consultation at mercerlaw.example.com/consult. Free parking behind the building.",
    "(614) 555-0127, office@mercerlaw.example.com.",
  ].join("\n"),
  spec: {
    version: 1,
    template: "professional",
    design: {
      composition: "editorial",
      primaryAction: "book",
      density: "airy",
      imageTreatment: "natural",
      rationale:
        "Small law office: calm editorial page, a big serif headline, flat fees listed like a table of contents.",
    },
    business: {
      name: "Mercer Law",
      category: "Family and estate law office",
      phone: "(614) 555-0127",
      email: "office@mercerlaw.example.com",
      address: "588 S Third St",
      city: "Columbus",
      state: "OH",
      hours: [
        { days: "Mon–Thu", time: "9 AM – 5 PM" },
        { days: "Fri", time: "9 AM – 1 PM" },
      ],
      highlights: ["Flat fees, quoted in writing", "Ohio bar since 2006"],
      links: { booking: "https://mercerlaw.example.com/consult" },
    },
    theme: {
      primary: "#6B2D2A",
      secondary: "#9C8F78",
      background: "#F6F2EA",
      text: "#1F1B16",
      font: "classic",
    },
    sections: [
      {
        type: "hero",
        title: "Put it in writing while it's still an easy conversation.",
        subtitle:
          "Wills, trusts, probate and divorce consultations from a two-person law office in German Village. Flat fees, quoted in writing before we start.",
        ctaLabel: "Book a consultation",
        imageQuery: "law office desk documents",
      },
      {
        type: "about",
        title: "A small office, on purpose",
        body: "Mercer Law is two people. You meet with me at the start, Ruth prepares every document, and the two of us sit with you when you sign. Nobody hands your file to someone you've never met.\n\nI can't promise a result in any case. What I can do is tell you plainly what Ohio law says and what each option costs, before you spend anything.",
        people: [
          {
            name: "Ellen Mercer",
            role: "Attorney",
            note: "Admitted to the Ohio bar in 2006. Opened the office in 2013.",
          },
          {
            name: "Ruth Okafor",
            role: "Paralegal",
            note: "Prepares every document and runs the signing meetings.",
          },
        ],
      },
      {
        type: "services",
        title: "What we do, and what it costs",
        items: [
          {
            name: "Will package",
            description:
              "Your will, a financial power of attorney, a health care power of attorney and a living will, drafted together so they agree with each other.",
            price: "$1,450 flat",
            detail: "Drafts in about two weeks",
          },
          {
            name: "Revocable living trust",
            description:
              "For families who want to keep the estate out of probate. The trust is written alongside the rest of your plan.",
            price: "from $3,200",
            detail: "Flat fee, quoted in writing",
          },
          {
            name: "Estate plan review",
            description:
              "Bring the documents you already have. We check them against your family today and Ohio law today.",
            price: "$350",
            detail: "One meeting",
          },
          {
            name: "Probate and estate administration",
            description:
              "Guidance for executors through Ohio probate, from the first filing to closing the estate.",
            price: "$285 an hour",
            detail: "Or a flat quote once we've seen the estate",
          },
          {
            name: "Divorce and dissolution consultation",
            description:
              "Sixty minutes to understand your options, the steps and the likely costs. Credited toward your fee if you hire us.",
            price: "$200",
            detail: "60 min",
          },
          {
            name: "Prenuptial agreements",
            description: "Drafted or reviewed, with time to talk it through before the wedding.",
            price: "from $1,800",
            detail: "Flat fee",
          },
        ],
      },
      {
        type: "faq",
        title: "Before your first meeting",
        items: [
          {
            q: "How does an estate plan come together?",
            a: "A first meeting to talk through your family and what you own. Drafts arrive in about two weeks. Then a signing meeting here at the office, with witnesses and a notary, so everything is done properly in one visit.",
          },
          {
            q: "Are your fees really flat?",
            a: "Wills, trusts, plan reviews and prenups are flat fees, quoted in writing before we start. Probate is $285 an hour, or a flat quote once we've seen the estate.",
          },
          {
            q: "Can you tell me how my divorce will turn out?",
            a: "No, and you should be careful with anyone who does. In the consultation I explain what Ohio law says, what your options are and what each one costs.",
          },
          {
            q: "Do you meet after work?",
            a: "Yes. Tuesday evening appointments are available by request. Our regular hours are Mon–Thu 9 AM – 5 PM and Fri 9 AM – 1 PM.",
          },
          {
            q: "Where do I park?",
            a: "There's free parking behind the building on S Third St.",
          },
        ],
      },
      {
        type: "contact",
        title: "Book a consultation",
        showForm: true,
        showMap: false,
      },
    ],
  },
};
