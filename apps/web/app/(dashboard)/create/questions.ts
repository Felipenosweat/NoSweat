import type { IntakeAnswer, TemplateId } from "@nosweat/schema";

// Perguntas rápidas do /create ("anamnese" do negócio): sim/não ou uma opção, todas opcionais.
// As respostas viram linhas no fim da descrição (server/ai/answers.ts) e a IA as lê como fatos
// que o dono declarou, então o site sai mais específico sem inventar nada. Sem React, para testar.

export type Question = {
  id: string;
  /** Texto da pergunta (também vai para a IA, antes da resposta). */
  text: string;
  options: readonly string[];
  /** Pode marcar mais de uma opção. */
  multi?: boolean;
  /** Campo "Other" de texto livre, com este exemplo no lugar do texto. */
  other?: string;
};

const YES_NO = ["Yes", "No"] as const;

const REACH: Question = {
  id: "reach",
  text: "How do customers contact you?",
  options: ["Phone call", "Text message", "Online form", "Email", "They walk in"],
  multi: true,
};

const HOURS: Question = {
  id: "hours",
  text: "When are you open?",
  options: [
    "Monday to Friday",
    "Monday to Saturday",
    "Every day",
    "Evenings and weekends",
    "By appointment only",
  ],
  other: "Or type your hours, like Mon–Fri 8 AM – 12 PM",
};

const PAY: Question = {
  id: "pay",
  text: "How do customers pay you?",
  options: [
    "At my business (card or cash)",
    "Online with my own payment link",
    "Cash only",
    "After the job, by invoice",
  ],
  multi: true,
};

const BY_KIND: Record<TemplateId, Question[]> = {
  beauty: [
    {
      id: "appointments",
      text: "Do customers book ahead or walk in?",
      options: ["Appointments only", "Walk-ins welcome", "Both"],
    },
    {
      id: "online-booking",
      text: "Do you want customers to book online from your website?",
      options: ["Yes", "No", "Not sure yet"],
    },
    {
      id: "offer",
      text: "What do you offer?",
      options: [
        "Haircuts",
        "Color",
        "Blowouts and styling",
        "Treatments",
        "Extensions",
        "Barber cuts and shaves",
        "Nails",
        "Lashes and brows",
        "Makeup",
        "Waxing",
      ],
      multi: true,
      other: "Anything else?",
    },
    {
      id: "team",
      text: "Do you work alone or with a team?",
      options: ["Just me", "A small team (2 to 5)", "A bigger team"],
    },
    HOURS,
    PAY,
    REACH,
  ],
  "home-services": [
    {
      id: "estimates",
      text: "Do you give free estimates?",
      options: YES_NO,
    },
    {
      id: "emergency",
      text: "Do you take emergency calls?",
      options: ["Yes, 24/7", "Yes, during extended hours", "No"],
    },
    {
      id: "licensed",
      text: "Are you licensed and insured?",
      options: ["Licensed and insured", "Licensed only", "Insured only", "Not yet"],
    },
    {
      id: "who",
      text: "Who do you work for?",
      options: ["Homeowners", "Renters and landlords", "Businesses", "Real estate agents"],
      multi: true,
    },
    HOURS,
    REACH,
    PAY,
  ],
  restaurant: [
    {
      id: "order",
      text: "How do customers get your food?",
      options: ["Dine-in", "Takeout", "Delivery", "Catering"],
      multi: true,
    },
    {
      id: "reservations",
      text: "Do you take reservations?",
      options: YES_NO,
    },
    {
      id: "diet",
      text: "Do you have options for special diets?",
      options: ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher"],
      multi: true,
    },
    HOURS,
    REACH,
  ],
  professional: [
    {
      id: "consult",
      text: "Do you offer a free first consultation?",
      options: YES_NO,
    },
    {
      id: "mode",
      text: "Where do you meet clients?",
      options: ["At my office", "Online or by phone", "At the client's place", "A mix"],
    },
    {
      id: "languages",
      text: "Do you speak other languages?",
      options: ["Spanish", "Portuguese", "Chinese", "French"],
      multi: true,
      other: "Another language?",
    },
    {
      id: "online-booking",
      text: "Do you want clients to book online from your website?",
      options: ["Yes", "No", "Not sure yet"],
    },
    HOURS,
    PAY,
    REACH,
  ],
  portfolio: [
    {
      id: "hire",
      text: "How do clients hire you?",
      options: ["They ask for a quote", "Fixed packages", "By the hour", "By the project"],
      multi: true,
    },
    {
      id: "travel",
      text: "Do you travel for work?",
      options: ["Yes", "No", "Only nearby"],
    },
    REACH,
    PAY,
  ],
};

/** Palavras que revelam o tipo de negócio quando a pessoa não escolheu um (passo "type"). */
const KIND_WORDS: [TemplateId, RegExp][] = [
  [
    "beauty",
    /\b(salon|barber|hair|nail|spa|lash|brow|tattoo|makeup|massage|waxing|braid|beauty|stylist)/i,
  ],
  [
    "restaurant",
    /\b(restaurant|cafe|café|coffee|bakery|taco|taqueria|pizza|bbq|grill|food|catering|bar\b|brunch|diner)/i,
  ],
  [
    "professional",
    /\b(law|attorney|account|tax|insurance|clinic|dental|dentist|therap|counsel|consult|tutor|real estate|realtor|doctor|chiropract|notary)/i,
  ],
  ["portfolio", /\b(photograph|designer|artist|musician|freelanc|videograph|illustrat|dj\b|painter of)/i],
  [
    "home-services",
    /\b(plumb|electric|clean|roof|landscap|lawn|hvac|paint|handyman|mover|moving|repair|pest|contractor|remodel|flooring|garage|auto)/i,
  ],
];

/** Tipo de negócio para escolher as perguntas: a escolha da pessoa, ou um palpite pelo texto. */
export function kindForQuestions(chosen: TemplateId | "auto", text: string): TemplateId | null {
  if (chosen !== "auto") return chosen;
  for (const [kind, words] of KIND_WORDS) if (words.test(text)) return kind;
  return null;
}

/** As perguntas do tipo (sem tipo reconhecido: só as gerais). */
export function questionsFor(kind: TemplateId | null): Question[] {
  return kind ? BY_KIND[kind] : [HOURS, REACH, PAY];
}

export type Picked = {
  /** Opções marcadas, por id da pergunta. */
  picks: Record<string, string[]>;
  /** Texto do campo "Other", por id da pergunta. */
  others: Record<string, string>;
};

/** Respostas que seguem para a IA: só o que a pessoa marcou ou digitou. */
export function answersFrom(questions: readonly Question[], picked: Picked): IntakeAnswer[] {
  const out: IntakeAnswer[] = [];
  for (const question of questions) {
    const parts = [
      ...(picked.picks[question.id] ?? []).filter((option) => question.options.includes(option)),
    ];
    const other = (picked.others[question.id] ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (other) parts.push(other);
    if (parts.length === 0) continue;
    out.push({ question: question.text, answer: parts.join(", ").slice(0, 240) });
  }
  return out.slice(0, 12);
}
