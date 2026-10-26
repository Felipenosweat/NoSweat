import { describe, expect, it } from "vitest";
import {
  firstNameOf,
  mailtoHref,
  reviewEmailSubject,
  reviewRequestMessage,
  smsHref,
} from "./reviews";

const LINK = "https://g.page/r/abc/review";

describe("pedido de avaliação", () => {
  it("monta o texto com o primeiro nome e o nome do negócio", () => {
    expect(
      reviewRequestMessage({ firstName: "Ana", businessName: "Joe's Plumbing", link: LINK }),
    ).toBe(
      `Hi Ana, thanks for choosing Joe's Plumbing! Would you mind leaving us a quick review? ${LINK}`,
    );
    expect(reviewRequestMessage({ businessName: "Joe's Plumbing", link: LINK })).toMatch(
      /^Hi there, thanks/,
    );
  });

  it("pega o primeiro nome", () => {
    expect(firstNameOf("  Ana   Souza ")).toBe("Ana");
    expect(firstNameOf(null)).toBe("");
  });

  it("links de SMS e e-mail com o texto codificado", () => {
    const body = reviewRequestMessage({ firstName: "Ana", businessName: "A&B", link: LINK });
    const sms = smsHref("(512) 555-0100", body);
    expect(sms.startsWith("sms:5125550100?&body=")).toBe(true);
    expect(decodeURIComponent(sms.split("body=")[1] ?? "")).toBe(body);
    expect(smsHref(null, "hi")).toBe("sms:?&body=hi");

    const mail = mailtoHref("ana@x.com", reviewEmailSubject("A&B"), body);
    expect(mail.startsWith("mailto:ana@x.com?subject=")).toBe(true);
    const params = new URLSearchParams(mail.split("?")[1]);
    expect(params.get("subject")).toBe("A quick favor from A&B");
    expect(params.get("body")).toBe(body);
  });
});
