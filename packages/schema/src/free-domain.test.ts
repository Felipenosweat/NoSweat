import { describe, expect, it } from "vitest";
import { DomainResponse, FreeDomainRegistrant, RegistrantPhone } from "./index";

const valid = {
  firstName: " Joe ",
  lastName: "Smith",
  email: "joe@example.com",
  phone: "(512) 555-0100",
  address1: "100 Main St",
  city: "Austin",
  state: "tx",
  zip: "78701",
};

describe("RegistrantPhone", () => {
  it.each([
    ["(512) 555-0100", "+1.5125550100"],
    ["512.555.0100", "+1.5125550100"],
    ["+1 512 555 0100", "+1.5125550100"],
    ["15125550100", "+1.5125550100"],
  ])("%s → %s", (input, expected) => {
    expect(RegistrantPhone.parse(input)).toBe(expected);
  });

  it.each(["555-0100", "+44 20 7946 0958", "(012) 555-0100", ""])("refuses %s", (input) => {
    expect(RegistrantPhone.safeParse(input).success).toBe(false);
  });
});

describe("FreeDomainRegistrant", () => {
  it("normalizes what people type and fixes the country to US", () => {
    expect(FreeDomainRegistrant.parse(valid)).toEqual({
      ...valid,
      firstName: "Joe",
      phone: "+1.5125550100",
      state: "TX",
      country: "US",
    });
  });

  it("refuses another country, a bad ZIP or a missing street", () => {
    expect(FreeDomainRegistrant.safeParse({ ...valid, country: "BR" }).success).toBe(false);
    expect(FreeDomainRegistrant.safeParse({ ...valid, zip: "7870" }).success).toBe(false);
    expect(FreeDomainRegistrant.safeParse({ ...valid, address1: " " }).success).toBe(false);
    expect(FreeDomainRegistrant.safeParse({ ...valid, state: "Texas" }).success).toBe(false);
  });
});

describe("DomainResponse.managed", () => {
  it("is optional (older responses still parse)", () => {
    const base = { siteId: "s1", domain: "joes.com", status: "pending", records: [] };
    expect(DomainResponse.parse(base).managed).toBeUndefined();
    expect(DomainResponse.parse({ ...base, managed: true }).managed).toBe(true);
  });
});
