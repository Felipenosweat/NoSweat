import { describe, expect, it } from "vitest";
import {
  isPaymentHandleValid,
  looksLikeAccountNumber,
  paymentPill,
  paymentPills,
  PaymentSettings,
  paymentSentence,
  SiteSpec,
} from "./index";

const parse = (value: unknown) => PaymentSettings.safeParse(value);

describe("PaymentSettings", () => {
  it("accepts the usual US methods with public handles", () => {
    const result = parse({
      methods: [
        { method: "cash" },
        { method: "card" },
        { method: "check" },
        { method: "zelle", handle: "(305) 555-0187" },
        { method: "venmo", handle: "@glowsalon-demo" },
        { method: "cash_app", handle: "$glowsalondemo" },
        { method: "paypal", handle: "https://paypal.me/glowsalon" },
      ],
      note: "Tips are always appreciated.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts Zelle by e-mail or by a phone number with the country code", () => {
    expect(isPaymentHandleValid("zelle", "pay@glowsalon.example.com")).toBe(true);
    expect(isPaymentHandleValid("zelle", "+1 305 555 0187")).toBe(true);
    expect(isPaymentHandleValid("zelle", "3055550187")).toBe(true);
    expect(isPaymentHandleValid("zelle", "hello")).toBe(false);
  });

  it("does not take URLs for Venmo and Cash App, and wants https paypal.me for PayPal", () => {
    expect(isPaymentHandleValid("venmo", "https://venmo.com/glow")).toBe(false);
    expect(isPaymentHandleValid("venmo", "glow")).toBe(false);
    expect(isPaymentHandleValid("cash_app", "https://cash.app/$glow")).toBe(false);
    expect(isPaymentHandleValid("cash_app", "glow")).toBe(false);
    expect(isPaymentHandleValid("paypal", "http://paypal.me/glow")).toBe(false);
    expect(isPaymentHandleValid("paypal", "https://evil.example.com/paypal.me/glow")).toBe(false);
    expect(isPaymentHandleValid("paypal", "https://www.paypal.me/glow")).toBe(true);
  });

  it("does not let cash, card and check carry a handle", () => {
    expect(parse({ methods: [{ method: "cash", handle: "@x" }] }).success).toBe(false);
  });

  it("rejects anything that looks like a card or bank account number", () => {
    expect(looksLikeAccountNumber("4242 4242 4242 4242")).toBe(true);
    expect(looksLikeAccountNumber("4242-4242-4242-4242")).toBe(true);
    expect(looksLikeAccountNumber("123456789012")).toBe(true);
    expect(looksLikeAccountNumber("Routing number 021000021")).toBe(true);
    expect(looksLikeAccountNumber("+1 (305) 555-0187")).toBe(false);
    expect(looksLikeAccountNumber("1-305-555-0187")).toBe(false);

    const cardAsHandle = parse({ methods: [{ method: "zelle", handle: "4242424242424242" }] });
    expect(cardAsHandle.success).toBe(false);
    const cardInNote = parse({ methods: [{ method: "cash" }], note: "Card 4242 4242 4242 4242" });
    expect(cardInNote.success).toBe(false);
    const accountInNote = parse({ methods: [{ method: "cash" }], note: "Account number 99887766" });
    expect(accountInNote.success).toBe(false);
  });

  it("rejects duplicate methods and too long text", () => {
    expect(parse({ methods: [{ method: "cash" }, { method: "cash" }] }).success).toBe(false);
    expect(parse({ methods: [{ method: "cash" }], note: "x".repeat(161) }).success).toBe(false);
    const longHandle = parse({ methods: [{ method: "zelle", handle: `${"a".repeat(80)}@x.com` }] });
    expect(longHandle.success).toBe(false);
  });

  it("is optional on the business and keeps a spec valid", () => {
    const base = {
      version: 1,
      template: "beauty",
      business: { name: "Glow" },
      theme: {
        primary: "#123456",
        secondary: "#ABCDEF",
        background: "#FFFFFF",
        text: "#111111",
        font: "modern",
      },
      sections: [
        { type: "hero", title: "Hi", subtitle: "There", ctaLabel: "Call" },
        { type: "contact", showForm: true, showMap: false },
      ],
    };
    expect(SiteSpec.safeParse(base).success).toBe(true);
    const withPayments = {
      ...base,
      business: { name: "Glow", payments: { methods: [{ method: "cash" }] } },
    };
    expect(SiteSpec.safeParse(withPayments).success).toBe(true);
    const bad = { ...base, business: { name: "Glow", payments: { methods: [{ method: "wire" }] } } };
    expect(SiteSpec.safeParse(bad).success).toBe(false);
  });
});

describe("payment text", () => {
  const payments = PaymentSettings.parse({
    methods: [
      { method: "cash" },
      { method: "card" },
      { method: "zelle", handle: "(305) 555-0187" },
      { method: "paypal", handle: "https://paypal.me/glow" },
    ],
    note: "Tips welcome.",
  });

  it("builds the pills", () => {
    expect(paymentPills(payments)).toEqual([
      "Cash",
      "Credit & debit cards",
      "Zelle · (305) 555-0187",
      "PayPal · paypal.me/glow",
    ]);
    expect(paymentPill({ method: "venmo", handle: "@glow" })).toBe("Venmo · @glow");
    expect(paymentPills(undefined)).toEqual([]);
  });

  it("builds one honest sentence", () => {
    expect(paymentSentence(payments)).toBe(
      "We accept cash, credit & debit cards, Zelle ((305) 555-0187) and PayPal (paypal.me/glow). Tips welcome.",
    );
    expect(paymentSentence(PaymentSettings.parse({ methods: [{ method: "check" }] }))).toBe(
      "We accept checks.",
    );
    expect(paymentSentence(undefined)).toBe("");
    expect(paymentSentence({ methods: [] })).toBe("");
  });
});
