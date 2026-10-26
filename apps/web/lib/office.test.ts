import { describe, expect, it } from "vitest";
import {
  addDays,
  bpsToPercentInput,
  formatTaxRate,
  invoiceBalances,
  invoiceItemsEditable,
  matchesEstimateFilter,
  matchesInvoiceFilter,
  mailtoHref,
  parseEstimateFilter,
  parseInvoiceFilter,
  parsePercentToBps,
  parseQuantity,
  searchDocuments,
  shareMessage,
  smsHref,
} from "./office";

describe("imposto em % e pontos-base", () => {
  it("converte pontos-base para o campo e de volta", () => {
    expect(bpsToPercentInput(825)).toBe("8.25");
    expect(bpsToPercentInput(800)).toBe("8");
    expect(bpsToPercentInput(0)).toBe("0");
    expect(formatTaxRate(650)).toBe("6.5%");
    expect(parsePercentToBps("8.25")).toBe(825);
    expect(parsePercentToBps(" 7% ")).toBe(700);
    expect(parsePercentToBps(".5")).toBe(50);
  });

  it("vazio é null; inválido ou acima de 30% é undefined", () => {
    expect(parsePercentToBps("")).toBeNull();
    expect(parsePercentToBps("8.255")).toBeUndefined();
    expect(parsePercentToBps("31")).toBeUndefined();
    expect(parsePercentToBps("abc")).toBeUndefined();
    expect(parsePercentToBps("30")).toBe(3000);
  });
});

describe("parseQuantity", () => {
  it("aceita até 2 casas e recusa zero", () => {
    expect(parseQuantity("1.5")).toBe(1.5);
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("0")).toBeUndefined();
    expect(parseQuantity("1.234")).toBeUndefined();
    expect(parseQuantity("")).toBeUndefined();
  });
});

describe("filtros", () => {
  it("orçamentos: Waiting = enviado; Declined junta recusado e vencido", () => {
    expect(matchesEstimateFilter("sent", "waiting")).toBe(true);
    expect(matchesEstimateFilter("expired", "declined")).toBe(true);
    expect(matchesEstimateFilter("draft", "waiting")).toBe(false);
    expect(matchesEstimateFilter("approved", "all")).toBe(true);
  });

  it("faturas: Unpaid inclui parcial e vencida, nunca rascunho ou anulada", () => {
    expect(matchesInvoiceFilter("partial", "unpaid")).toBe(true);
    expect(matchesInvoiceFilter("overdue", "unpaid")).toBe(true);
    expect(matchesInvoiceFilter("draft", "unpaid")).toBe(false);
    expect(matchesInvoiceFilter("void", "unpaid")).toBe(false);
    expect(matchesInvoiceFilter("overdue", "overdue")).toBe(true);
  });
});

describe("filtros da URL", () => {
  it("aceita os status do contrato que o painel inicial usa", () => {
    expect(parseEstimateFilter("sent")).toBe("waiting");
    expect(parseEstimateFilter("expired")).toBe("declined");
    expect(parseEstimateFilter("approved")).toBe("approved");
    expect(parseEstimateFilter("bogus")).toBe("all");
    expect(parseInvoiceFilter("overdue")).toBe("overdue");
    expect(parseInvoiceFilter("paid")).toBe("paid");
    expect(parseInvoiceFilter("partial")).toBe("unpaid");
    expect(parseInvoiceFilter("void")).toBe("all");
  });
});

describe("invoiceBalances", () => {
  it("soma o saldo das faturas em aberto e separa as vencidas", () => {
    const totals = invoiceBalances([
      { status: "sent", balanceCents: 10_000 },
      { status: "partial", balanceCents: 2_500 },
      { status: "overdue", balanceCents: 4_000 },
      { status: "paid", balanceCents: 0 },
      { status: "draft", balanceCents: 9_999 },
      { status: "void", balanceCents: 5_000 },
    ]);
    expect(totals).toEqual({
      unpaidCents: 16_500,
      unpaidCount: 3,
      overdueCents: 4_000,
      overdueCount: 1,
    });
  });
});

describe("invoiceItemsEditable", () => {
  it("só sem pagamento e antes de paga/anulada", () => {
    expect(invoiceItemsEditable({ status: "sent", payments: [] })).toBe(true);
    expect(invoiceItemsEditable({ status: "void", payments: [] })).toBe(false);
    expect(
      invoiceItemsEditable({
        status: "partial",
        payments: [
          {
            id: "p1",
            invoiceId: "i1",
            amountCents: 100,
            method: "cash",
            reference: "",
            receivedOn: "2026-10-01",
            createdAt: "2026-10-01T00:00:00Z",
          },
        ],
      }),
    ).toBe(false);
  });
});

describe("datas e busca", () => {
  it("addDays atravessa meses e anos", () => {
    expect(addDays("2026-10-26", 30)).toBe("2026-11-25");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("acha por cliente, título ou número", () => {
    const docs = [
      { number: 1001, clientName: "Ana Lima", title: "Kitchen sink" },
      { number: 1002, clientName: "Bob Ray", title: "Water heater" },
    ];
    expect(searchDocuments(docs, "ana").map((d) => d.number)).toEqual([1001]);
    expect(searchDocuments(docs, "#1002").map((d) => d.number)).toEqual([1002]);
    expect(searchDocuments(docs, "HEATER").map((d) => d.number)).toEqual([1002]);
    expect(searchDocuments(docs, "")).toHaveLength(2);
  });
});

describe("compartilhar", () => {
  it("monta a mensagem e os links de SMS e e-mail", () => {
    const text = shareMessage({
      kind: "estimate",
      companyName: "Joe's Plumbing",
      clientName: "Ana Lima",
      number: 1001,
      url: "https://nosweatfd.com/q/abc",
      totalCents: 125_000,
    });
    expect(text).toBe(
      "Hi Ana, here's your estimate #1001 from Joe's Plumbing ($1,250.00): https://nosweatfd.com/q/abc",
    );
    expect(smsHref("(512) 555-0100", "Hi")).toBe("sms:5125550100?&body=Hi");
    expect(mailtoHref("ana@example.com", "Estimate #1", "a b")).toBe(
      "mailto:ana@example.com?subject=Estimate%20%231&body=a%20b",
    );
  });
});
