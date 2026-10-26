import { computeTotals, type DocumentTotals, type LineItem, type PriceItem } from "@nosweat/schema";
import {
  bpsToPercentInput,
  centsToInput,
  formatQuantity,
  parseDollars,
  parsePercentToBps,
  parseQuantity,
} from "@/lib/office";

// Estado de edição dos itens de um orçamento/fatura: os campos guardam o texto digitado (para não
// brigar com quem digita "1." ou "$12,"), e viram `LineItem` só na hora de salvar. Os totais da
// tela usam o mesmo `computeTotals` do servidor (que recalcula de qualquer jeito).

export type DraftLine = {
  /** Chave só da tela (a ordem das linhas pode mudar ao apagar). */
  key: string;
  priceItemId: string | null;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxable: boolean;
};

export type LineErrors = Partial<Record<"name" | "quantity" | "unitPrice", string>>;

let counter = 0;
export function newLineKey(): string {
  counter += 1;
  return `line-${Date.now().toString(36)}-${counter}`;
}

export function linesFromItems(items: readonly LineItem[]): DraftLine[] {
  return items.map((item) => ({
    key: newLineKey(),
    priceItemId: item.priceItemId,
    name: item.name,
    description: item.description,
    quantity: formatQuantity(item.quantity),
    unitPrice: centsToInput(item.unitPriceCents),
    taxable: item.taxable,
  }));
}

export function blankLine(taxable = true): DraftLine {
  return {
    key: newLineKey(),
    priceItemId: null,
    name: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    taxable,
  };
}

export function lineFromPriceItem(item: PriceItem): DraftLine {
  return {
    key: newLineKey(),
    priceItemId: item.id,
    name: item.name,
    description: item.description,
    quantity: "1",
    unitPrice: centsToInput(item.unitPriceCents),
    taxable: item.taxable,
  };
}

/** Linhas digitadas → itens do contrato, com o erro de cada campo (chave da linha). */
export function toLineItems(lines: readonly DraftLine[]): {
  items: LineItem[];
  errors: Record<string, LineErrors>;
} {
  const items: LineItem[] = [];
  const errors: Record<string, LineErrors> = {};
  for (const line of lines) {
    const lineErrors: LineErrors = {};
    const name = line.name.trim();
    if (!name) lineErrors.name = "Each line needs a name.";
    else if (name.length > 120) lineErrors.name = "Keep the name under 120 characters.";
    const quantity = parseQuantity(line.quantity);
    if (quantity === undefined) lineErrors.quantity = "Enter a quantity like 1 or 1.5.";
    const price = parseDollars(line.unitPrice);
    if (price === undefined) lineErrors.unitPrice = "Enter a price like 120 or 89.50.";
    if (Object.keys(lineErrors).length > 0) {
      errors[line.key] = lineErrors;
      continue;
    }
    items.push({
      priceItemId: line.priceItemId,
      name,
      description: line.description.trim().slice(0, 1000),
      quantity: quantity ?? 1,
      unitPriceCents: price ?? 0,
      taxable: line.taxable,
    });
  }
  return { items, errors };
}

/** Totais ao vivo (campos inválidos contam como zero). */
export function draftTotals(
  lines: readonly DraftLine[],
  taxInput: string,
  discountInput: string,
): DocumentTotals {
  const items = lines.map((line) => ({
    quantity: parseQuantity(line.quantity) ?? 0,
    unitPriceCents: parseDollars(line.unitPrice) ?? 0,
    taxable: line.taxable,
  }));
  return computeTotals(items, parsePercentToBps(taxInput) ?? 0, parseDollars(discountInput) ?? 0);
}

/** Campos do documento que a tela edita (para saber se há mudança sem salvar). */
export type DocumentForm = {
  title: string;
  lines: DraftLine[];
  taxRate: string;
  discount: string;
  message: string;
  /** "Valid until" (orçamento) ou "Due" (fatura); "" = sem data. */
  date: string;
};

export function formFromDocument(doc: {
  title: string;
  items: readonly LineItem[];
  taxRateBps: number;
  discountCents: number;
  message: string;
  date: string | null;
}): DocumentForm {
  return {
    title: doc.title,
    lines: linesFromItems(doc.items),
    taxRate: bpsToPercentInput(doc.taxRateBps),
    discount: centsToInput(doc.discountCents, true),
    message: doc.message,
    date: doc.date ?? "",
  };
}

/** Assinatura comparável do formulário (ignora as chaves das linhas). */
export function formSignature(form: DocumentForm): string {
  return JSON.stringify([
    form.title.trim(),
    form.lines.map((l) => [
      l.priceItemId,
      l.name.trim(),
      l.description.trim(),
      l.quantity.trim(),
      parseDollars(l.unitPrice) ?? l.unitPrice,
      l.taxable,
    ]),
    parsePercentToBps(form.taxRate) ?? form.taxRate,
    parseDollars(form.discount) ?? 0,
    form.message.trim(),
    form.date,
  ]);
}

export type FormProblems = {
  lines: Record<string, LineErrors>;
  taxRate?: string;
  discount?: string;
  title?: string;
  message?: string;
  /** Erro da lista inteira (ex.: linhas demais). */
  items?: string;
};

/** Valida o formulário e devolve o corpo comum de criação/edição (sem cliente nem data). */
export function validateForm(form: DocumentForm):
  | {
      ok: true;
      body: {
        title: string;
        items: LineItem[];
        taxRateBps: number;
        discountCents: number;
        message: string;
      };
    }
  | { ok: false; problems: FormProblems } {
  const { items, errors } = toLineItems(form.lines);
  const problems: FormProblems = { lines: errors };
  const taxRateBps = parsePercentToBps(form.taxRate);
  if (taxRateBps === undefined) problems.taxRate = "Use a tax rate from 0 to 30%, like 8.25.";
  const discountCents = parseDollars(form.discount);
  if (discountCents === undefined) problems.discount = "Enter an amount like 50 or 25.50.";
  if (form.title.trim().length > 160) problems.title = "Keep the title under 160 characters.";
  if (form.message.trim().length > 4000) problems.message = "Keep the message under 4,000 characters.";
  if (form.lines.length > 100) problems.items = "Use up to 100 lines.";
  const hasProblem =
    Object.keys(errors).length > 0 ||
    problems.taxRate !== undefined ||
    problems.discount !== undefined ||
    problems.title !== undefined ||
    problems.message !== undefined ||
    problems.items !== undefined;
  if (hasProblem) return { ok: false, problems };
  return {
    ok: true,
    body: {
      title: form.title.trim(),
      items,
      taxRateBps: taxRateBps ?? 0,
      discountCents: discountCents ?? 0,
      message: form.message.trim(),
    },
  };
}
