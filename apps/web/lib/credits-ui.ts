// Regras de tela dos créditos da IA (o "pill" do menu, avisos de custo). Funções puras e sem
// dependências do servidor, para testar fácil. Preços e cotas: server/credits/pricing.ts.

/** O que o pill precisa saber do saldo (parte do `CreditBalance` do schema). */
export type PillBalance = {
  unlimited: boolean;
  total: number;
  monthlyAllowance: number;
  resetsAt: string;
};

/** `ok` normal; `low` pouco saldo (âmbar); `empty` zerou (vermelho); `unlimited` admin. */
export type CreditState = "ok" | "low" | "empty" | "unlimited";

/** Pouco saldo: até 5 créditos ou até 20% da cota do mês. */
export const LOW_CREDITS = 5;
export const LOW_SHARE = 0.2;

export function creditState(balance: PillBalance): CreditState {
  if (balance.unlimited) return "unlimited";
  if (balance.total <= 0) return "empty";
  if (balance.total <= LOW_CREDITS || balance.total <= balance.monthlyAllowance * LOW_SHARE) {
    return "low";
  }
  return "ok";
}

/** "1 credit", "27 credits", "1,200 credits". */
export function creditsLabel(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "credit" : "credits"}`;
}

const refillFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Dec 1" (a cota volta no começo do mês, UTC). Data inválida = `null`. */
export function refillDate(iso: string): string | null {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : refillFormat.format(new Date(time));
}

/** Texto curto do pill: "27 credits", "Get credits" (zerou) ou "Unlimited". */
export function pillText(balance: PillBalance): string {
  const state = creditState(balance);
  if (state === "unlimited") return "Unlimited";
  if (state === "empty") return "Get credits";
  return creditsLabel(balance.total);
}

/** Rótulo para leitor de tela: "AI credits: 27 left, refills Dec 1". */
export function pillAriaLabel(balance: PillBalance): string {
  const state = creditState(balance);
  if (state === "unlimited") return "AI credits: unlimited";
  const refill = refillDate(balance.resetsAt);
  const refillPart = refill ? `, refills ${refill}` : "";
  if (state === "empty") return `AI credits: none left${refillPart}. Get more credits`;
  return `AI credits: ${balance.total.toLocaleString("en-US")} left${refillPart}`;
}

/** Dica ao passar o mouse (`title`). */
export function pillTitle(balance: PillBalance): string {
  const state = creditState(balance);
  if (state === "unlimited") return "Admin accounts use AI without limits";
  const refill = refillDate(balance.resetsAt);
  const refillPart = refill ? `Monthly credits refill on ${refill}.` : "";
  if (state === "empty") return `You're out of AI credits. ${refillPart}`.trim();
  return `AI credits left. ${refillPart}`.trim();
}

/** Aviso dos eventos de saldo: o saldo novo (`left`) ou quanto acabou de ser gasto (`spent`). */
export type CreditsEventDetail = { left?: number; spent?: number };

/** Aplica um aviso ao saldo mostrado. Admin (sem limite) nunca muda. */
export function applyCreditsEvent(balance: PillBalance, detail: CreditsEventDetail): PillBalance {
  if (balance.unlimited) return balance;
  if (typeof detail.left === "number" && Number.isFinite(detail.left)) {
    return { ...balance, total: Math.max(0, Math.floor(detail.left)) };
  }
  if (typeof detail.spent === "number" && Number.isFinite(detail.spent)) {
    return { ...balance, total: Math.max(0, balance.total - Math.max(0, Math.floor(detail.spent))) };
  }
  return balance;
}

/**
 * Linha de custo antes de uma ação da IA: "Creating your website uses 5 credits · you have 30".
 * `left` = `null` quando não se sabe o saldo (só mostra o custo). `short` = não dá para pagar.
 */
export function costNote(
  verb: string,
  cost: number,
  left: number | null,
): { text: string; short: boolean } {
  const base = `${verb} uses ${creditsLabel(cost)}`;
  if (left === null) return { text: base, short: false };
  return {
    text: `${base} · you have ${left.toLocaleString("en-US")}`,
    short: left < cost,
  };
}
