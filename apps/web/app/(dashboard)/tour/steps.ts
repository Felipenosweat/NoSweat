// Passos do tour guiado (os "coach marks"): em cada um, a tela certa, o elemento de verdade que
// fica em destaque (`data-tour="..."` no componente) e o que ele faz. Só dados e funções puras
// (sem React, sem DOM): usado pelo WelcomeTour e pelos testes.
//
// Ordem no computador: Home (dinheiro, hoje, site) → cada item do menu, e logo depois a tela dele
// com o botão principal → ajuda. No celular, o que mora em "More" (Estimates, Invoices, Social,
// Google reviews, Business settings, Help) vira um passo só, no botão "More" (a folha não abre).

/** Tela do computador (barra lateral, `lg:` em diante) ou do celular/tablet (barra de abas). */
export type TourViewport = "desktop" | "mobile";

/** Largura a partir da qual a barra lateral aparece (o `lg:` do Tailwind). */
export const DESKTOP_MIN_WIDTH = 1024;

export function viewportFor(width: number): TourViewport {
  return width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile";
}

/**
 * Um alvo possível: o valor de `data-tour` e, se precisar, outro texto para quando é ele que
 * aparece (ex.: conta sem site mostra o quadro "Your sites" em vez do botão "Edit").
 */
export type TourTarget = { id: string; title?: string; body?: string };

/** Passo pronto para mostrar (já escolhido para a tela). */
export type SpotlightStep = {
  id: string;
  /** Página onde o alvo mora (o tour navega até ela). */
  route: string;
  /** Alvos em ordem de preferência: vale o primeiro que estiver visível. */
  targets: readonly TourTarget[];
  title: string;
  body: string;
};

type StepDef = SpotlightStep & {
  /** No celular: outros alvos (a aba em vez do item da barra lateral). */
  mobileTargets?: readonly TourTarget[];
  /** No celular este item fica dentro de "More": entra no passo único do botão "More". */
  inMore?: boolean;
};

const HOME = "/dashboard";

// Textos: uma ou duas frases, o que a pessoa ganha e onde tocar. Nada de promessa que o produto
// não cumpre (pagamento online não existe; a IA nunca publica sozinha).
const STEP_DEFS: readonly StepDef[] = [
  {
    id: "home-money",
    route: HOME,
    targets: [{ id: "home-money" }],
    title: "Your money at a glance",
    body: "What’s unpaid, what’s overdue, estimates waiting for a yes and what you collected this month. Tap a number to see the list.",
  },
  {
    id: "home-today",
    route: HOME,
    targets: [{ id: "home-today" }],
    title: "Today’s jobs",
    body: "Everything booked for today, in order. Nothing yet? Tap New job to book one.",
  },
  {
    id: "site-edit",
    route: HOME,
    targets: [
      { id: "site-edit" },
      {
        id: "home-sites",
        title: "Your website",
        body: "Your website lives here. Describe your business and we build it for you, then you can change any text or photo.",
      },
    ],
    title: "Edit your website",
    body: "Tap Edit to change any text or photo. When it looks right, publish it and it’s online.",
  },
  {
    id: "nav-clients",
    route: HOME,
    targets: [{ id: "nav-clients" }],
    mobileTargets: [{ id: "tab-clients" }],
    title: "Clients",
    body: "Everyone who fills out the form on your website lands here on their own, plus anyone you add.",
  },
  {
    id: "clients-add",
    route: "/clients",
    targets: [{ id: "clients-add" }],
    title: "Add a client",
    body: "Add the people you already work with. Open anyone to call or text them in one tap and see their history.",
  },
  {
    id: "nav-schedule",
    route: "/clients",
    targets: [{ id: "nav-schedule" }],
    mobileTargets: [{ id: "tab-schedule" }],
    title: "Schedule",
    body: "Every job on one calendar, so you always know where you need to be.",
  },
  {
    id: "schedule-new",
    route: "/schedule",
    targets: [{ id: "schedule-new" }],
    title: "Book a job",
    body: "Tap New job, or tap an open time on the calendar, to book it for a client.",
  },
  {
    id: "nav-estimates",
    route: "/schedule",
    targets: [{ id: "nav-estimates" }],
    inMore: true,
    title: "Estimates",
    body: "Send a price your customer can approve right from their phone.",
  },
  {
    id: "estimates-new",
    route: "/estimates",
    targets: [{ id: "estimates-new" }],
    title: "Send an estimate",
    body: "Add the work and the price, then send the link by text or email. You see when it’s approved.",
  },
  {
    id: "nav-invoices",
    route: "/estimates",
    targets: [{ id: "nav-invoices" }],
    inMore: true,
    title: "Invoices",
    body: "Bill for the work and keep track of who paid.",
  },
  {
    id: "invoices-new",
    route: "/invoices",
    targets: [
      { id: "invoices-new" },
      {
        id: "invoices-summary",
        title: "What you’re owed",
        body: "Unpaid and overdue totals, always up to date. Tap one to see those invoices.",
      },
    ],
    title: "Get paid",
    body: "Send an invoice link by text or email, then mark it paid when the cash, check or Zelle comes in.",
  },
  {
    id: "nav-social",
    route: "/invoices",
    targets: [{ id: "nav-social" }],
    inMore: true,
    title: "Instagram posts",
    body: "AI drafts a month of posts from your website. Nothing goes out until you approve it.",
  },
  {
    id: "nav-reviews",
    route: "/invoices",
    targets: [{ id: "nav-reviews" }],
    inMore: true,
    title: "Google reviews",
    body: "Paste your Google review link once and your website gets a “Review us on Google” button.",
  },
  {
    id: "nav-settings",
    route: "/invoices",
    targets: [{ id: "nav-settings" }],
    inMore: true,
    title: "Business settings",
    body: "Your company details, sales tax and payment terms, used on every estimate and invoice.",
  },
  {
    id: "nav-help",
    route: "/invoices",
    targets: [
      { id: "nav-help" },
      { id: "nav-tour", body: "Replay this walk-through anytime from here." },
    ],
    inMore: true,
    title: "Help is one tap away",
    body: "Tap Help to message our team. Take the tour, right below it, replays this walk-through.",
  },
];

/** Passo único do celular para tudo o que mora em "More". */
const MORE_STEP: Omit<SpotlightStep, "route"> = {
  id: "tab-more",
  targets: [{ id: "tab-more" }],
  title: "More",
  body: "Find Estimates, Invoices, Social, Google reviews, Business settings and Help here.",
};

function plain(def: StepDef, targets: readonly TourTarget[]): SpotlightStep {
  return { id: def.id, route: def.route, targets, title: def.title, body: def.body };
}

/** Os passos para a tela. No celular, os itens de "More" viram um passo só, no lugar do primeiro. */
export function spotlightSteps(viewport: TourViewport): SpotlightStep[] {
  if (viewport === "desktop") return STEP_DEFS.map((def) => plain(def, def.targets));
  const steps: SpotlightStep[] = [];
  let moreAdded = false;
  for (const def of STEP_DEFS) {
    if (def.inMore) {
      if (!moreAdded) steps.push({ ...MORE_STEP, route: def.route });
      moreAdded = true;
      continue;
    }
    steps.push(plain(def, def.mobileTargets ?? def.targets));
  }
  return steps;
}

/**
 * A tela mudou de tamanho no meio do tour (ex.: girou o tablet) e a lista de passos mudou: o
 * índice equivalente na lista nova. Mesmo `id` → ele; um item de "More" ↔ o passo "More";
 * senão, o primeiro passo da lista nova que vinha depois do atual na antiga.
 */
export function remapStepIndex(
  from: readonly SpotlightStep[],
  to: readonly SpotlightStep[],
  index: number,
): number {
  if (to.length === 0) return 0;
  const current = from[index];
  if (!current) return Math.min(Math.max(index, 0), to.length - 1);
  const same = to.findIndex((step) => step.id === current.id);
  if (same >= 0) return same;

  const moreIds = new Set(STEP_DEFS.filter((def) => def.inMore).map((def) => def.id));
  if (moreIds.has(current.id)) {
    const more = to.findIndex((step) => step.id === MORE_STEP.id);
    if (more >= 0) return more;
  }
  if (current.id === MORE_STEP.id) {
    const first = to.findIndex((step) => moreIds.has(step.id));
    if (first >= 0) return first;
  }
  // O primeiro que vinha depois na lista antiga e existe na nova.
  for (let i = index + 1; i < from.length; i += 1) {
    const later = to.findIndex((step) => step.id === from[i]?.id);
    if (later >= 0) return later;
  }
  return to.length - 1;
}

/** Para onde ir quando o alvo do passo não apareceu (o passo é pulado, sem travar o tour). */
export function nextAfterMissing(
  index: number,
  direction: "forward" | "back",
  total: number,
): { index: number; direction: "forward" | "back" } | "finish" {
  if (direction === "back") {
    // Voltando e o primeiro sumiu: segue para a frente a partir dele.
    return index > 0
      ? { index: index - 1, direction: "back" }
      : total > 1
        ? { index: 1, direction: "forward" }
        : "finish";
  }
  return index + 1 < total ? { index: index + 1, direction: "forward" } : "finish";
}

/** "3 of 15". */
export function stepCounter(index: number, total: number): string {
  return `${index + 1} of ${total}`;
}

/** Título e texto do passo para o alvo que apareceu. */
export function stepCopy(
  step: SpotlightStep,
  targetId: string | null,
): { title: string; body: string } {
  const target = step.targets.find((t) => t.id === targetId);
  return { title: target?.title ?? step.title, body: target?.body ?? step.body };
}
