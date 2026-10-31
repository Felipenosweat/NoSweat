// Fatos da demonstração Mercer Law. Fonte única: packages/fixtures/src/library/mercer-law.ts
// (brief + spec). Nada aqui vai além dela (regra 8): sem depoimentos, notas, prêmios, anos de
// experiência, taxa de sucesso ou promessa de resultado. O escritório é FICTÍCIO.

export const FIRM = {
  name: "Mercer Law",
  category: "Family and estate law",
  attorney: "Ellen Mercer",
  paralegal: "Ruth Okafor",
  phone: "(614) 555-0127",
  tel: "+16145550127",
  email: "office@mercerlaw.example.com",
  street: "588 S Third St",
  neighborhood: "German Village",
  city: "Columbus",
  state: "OH",
  barSince: 2006,
  opened: 2013,
  parking: "Free parking behind the building.",
  evenings: "Tuesday evening appointments by request.",
} as const;

/** Horário (dia da semana em JS: 0 = domingo). Sexta fecha à 1 da tarde. */
export const HOURS = [
  { days: "Mon–Thu", time: "9 AM – 5 PM" },
  { days: "Fri", time: "9 AM – 1 PM" },
] as const;

export const OPEN_BY_WEEKDAY: Record<number, { open: number; close: number } | undefined> = {
  1: { open: 9, close: 17 },
  2: { open: 9, close: 17 },
  3: { open: 9, close: 17 },
  4: { open: 9, close: 17 },
  5: { open: 9, close: 13 },
};

export type Matter = {
  id: string;
  /** Número no índice (§ 2.x). */
  no: string;
  group: "Planning ahead" | "After a death" | "Marriage and divorce";
  name: string;
  description: string;
  price: string;
  detail: string;
  /** Uma linha para o resumo da consulta (formulário). */
  short: string;
};

export const MATTERS: Matter[] = [
  {
    id: "will",
    no: "2.1",
    group: "Planning ahead",
    name: "Will package",
    description:
      "Your will, a financial power of attorney, a health care power of attorney and a living will, drafted together as one package.",
    price: "$1,450 flat",
    detail: "Drafts in about two weeks",
    short: "Will package, $1,450 flat",
  },
  {
    id: "trust",
    no: "2.2",
    group: "Planning ahead",
    name: "Revocable living trust",
    description: "A revocable living trust, drafted together with the rest of your estate plan.",
    price: "from $3,200",
    detail: "Flat fee, quoted in writing",
    short: "Revocable living trust, from $3,200",
  },
  {
    id: "review",
    no: "2.3",
    group: "Planning ahead",
    name: "Estate plan review",
    description:
      "We read the estate plan you already have and tell you whether it still fits your family and current Ohio law.",
    price: "$350",
    detail: "One meeting",
    short: "Estate plan review, $350",
  },
  {
    id: "probate",
    no: "2.4",
    group: "After a death",
    name: "Probate and estate administration",
    description: "Help for executors and families handling an estate in Ohio probate.",
    price: "$285 an hour",
    detail: "Or a flat quote once we've seen the estate",
    short: "Probate, $285 an hour or a flat quote",
  },
  {
    id: "divorce",
    no: "2.5",
    group: "Marriage and divorce",
    name: "Divorce and dissolution consultation",
    description:
      "A one-hour meeting about your options, the steps and the likely costs. The fee is credited if you hire us.",
    price: "$200",
    detail: "60 minutes, credited if you hire us",
    short: "Divorce consultation, $200 for 60 minutes",
  },
  {
    id: "prenup",
    no: "2.6",
    group: "Marriage and divorce",
    name: "Prenuptial agreements",
    description: "Prenuptial agreements drafted at a flat fee, quoted in writing.",
    price: "from $1,800",
    detail: "Flat fee",
    short: "Prenuptial agreement, from $1,800",
  },
];

export const STEPS = [
  {
    no: "1",
    when: "First",
    title: "A first meeting with Ellen",
    body: "We talk through your family and what you own. You meet with Ellen at the start, and she tells you plainly what Ohio law says and what each option costs.",
  },
  {
    no: "2",
    when: "About two weeks",
    title: "Drafts",
    body: "Ruth Okafor, our paralegal, prepares every document. Drafts are ready in about two weeks, so your file stays with the two people you met.",
  },
  {
    no: "3",
    when: "When you're ready",
    title: "Signing at the office",
    body: "You sign here at 588 S Third St with witnesses and a notary. Ruth runs the signing meeting.",
  },
] as const;

export const PEOPLE = [
  {
    initials: "EM",
    name: "Ellen Mercer",
    role: "Attorney",
    lines: [
      "Admitted to the Ohio bar in 2006.",
      "Opened the office in 2013.",
      "Meets every client at the start.",
    ],
  },
  {
    initials: "RO",
    name: "Ruth Okafor",
    role: "Paralegal",
    lines: ["Prepares every document.", "Runs the signing meetings."],
  },
] as const;

export const FAQ = [
  {
    q: "How does an estate plan come together?",
    a: "We start with a meeting about your family and what you own. Drafts are ready in about two weeks, and then you sign here at the office with witnesses and a notary.",
  },
  {
    q: "Are your fees really flat?",
    a: "Wills, trusts, plan reviews and prenups are flat fees, quoted in writing before we start. Probate is $285 an hour, or a flat quote once we've seen the estate.",
  },
  {
    q: "Can you tell me how my divorce will turn out?",
    a: "No. In the consultation Ellen explains what Ohio law says, what your options are and what each one costs.",
  },
  {
    q: "Do you meet after work?",
    a: "Yes, on Tuesday evenings by request. Our regular hours are Mon–Thu 9 AM – 5 PM and Fri 9 AM – 1 PM.",
  },
  {
    q: "Where do I park?",
    a: "There's free parking behind the building on S Third St.",
  },
] as const;

/** Capítulos (§) na ordem da página: o trilho lateral e o menu do celular usam esta lista. */
export const SECTIONS = [
  { id: "office", no: "1", label: "The office" },
  { id: "fees", no: "2", label: "Services and fees" },
  { id: "first-meeting", no: "3", label: "First meeting" },
  { id: "people", no: "4", label: "Ellen and Ruth" },
  { id: "questions", no: "5", label: "Questions" },
  { id: "book", no: "6", label: "Consultation" },
] as const;
