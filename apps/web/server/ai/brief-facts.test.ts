import { describe, expect, it } from "vitest";
import { composeBrief, EMPTY_FIELDS, type CreateFields } from "@/app/(dashboard)/create/brief";
import {
  cutAtWord,
  factsFromBrief,
  hoursFromBrief,
  nameFromBrief,
  phoneFromBrief,
  placeFromBrief,
  serviceAreaFromBrief,
  servicesFromWhat,
  whatFromBrief,
} from "./brief-facts";
import { formatUsPhone, phonesIn } from "./model-fill";

/** O pedido exatamente como o /create manda (composeBrief). */
const brief = (fields: Partial<CreateFields>) => composeBrief({ ...EMPTY_FIELDS, ...fields });

describe("nameFromBrief", () => {
  it("reads the name sentence the /create wizard writes first", () => {
    expect(nameFromBrief(brief({ name: "Joe's Plumbing", what: "Plumbing repairs" }))).toBe(
      "Joe's Plumbing",
    );
    expect(nameFromBrief(brief({ name: "Bright Ideas Co.", what: "Gift baskets" }))).toBe(
      "Bright Ideas Co.",
    );
    expect(nameFromBrief(brief({ name: "St. Mark's Bakery", what: "Bread" }))).toBe(
      "St. Mark's Bakery",
    );
  });

  it("still reads the name at the start of a free-form brief", () => {
    expect(nameFromBrief("Fade House, a barbershop in Chicago, IL.")).toBe("Fade House");
    expect(nameFromBrief("Glow Salon is a hair studio in Miami, FL.")).toBe("Glow Salon");
    expect(nameFromBrief("Sparkle & Co. Cleaning, house cleaning in Worcester, MA.")).toBe(
      "Sparkle & Co. Cleaning",
    );
  });

  it.each([
    "The business does plumbing in Austin, TX.",
    "We do plumbing in Austin, TX.",
    "Our team cleans houses in Worcester, MA.",
    "Plumbing repairs in Austin, TX.",
    "Hair salon in Miami, FL.",
    "I'm a photographer in Asheville, NC.",
  ])("never takes a generic phrase as the name: %s", (text) => {
    expect(nameFromBrief(text)).toBeUndefined();
  });
});

describe("phoneFromBrief", () => {
  it.each([
    "512-555-0142",
    "512.555.0142",
    "5125550142",
    "+1 512 555 0142",
    "(512)555-0142",
    "(512) 555-0142",
    "1-512-555-0142",
  ])("normalizes %s to (512) 555-0142", (phone) => {
    expect(phoneFromBrief(brief({ name: "Joe's", what: "Plumbing", phone }))).toBe(
      "(512) 555-0142",
    );
  });

  it("uses the shared phonesIn and formatUsPhone helpers", () => {
    expect(phonesIn("Call +1 512 555 0142 today")).toEqual(["5125550142"]);
    expect(formatUsPhone("15125550142")).toBe("(512) 555-0142");
    expect(formatUsPhone("555-0142")).toBeUndefined();
    expect(formatUsPhone("012-555-0142")).toBeUndefined();
  });

  it("finds no phone when there is none", () => {
    expect(phoneFromBrief(brief({ name: "Joe's", what: "Plumbing" }))).toBeUndefined();
  });
});

describe("placeFromBrief", () => {
  it.each([
    ["Austin", "TX"],
    ["McAllen", "TX"],
    ["St. Louis", "MO"],
    ["Winston-Salem", "NC"],
    ["Coeur d'Alene", "ID"],
    ["Denver", "CO"],
  ])("reads %s, %s from the 'Based in' sentence", (city, state) => {
    expect(placeFromBrief(brief({ name: "X Co", what: "Repairs", city, state }))).toEqual({
      city,
      state,
    });
  });

  it("validates the state code", () => {
    expect(placeFromBrief("The business is called X. Based in Austin, XX.")).toEqual({
      city: "Austin",
    });
    expect(placeFromBrief(brief({ name: "X", what: "Repairs", state: "TX" }))).toEqual({
      state: "TX",
    });
    expect(placeFromBrief("Movers in Springfield, ZZ.")).toEqual({});
  });

  it("falls back to 'City, ST' in a free-form brief", () => {
    expect(placeFromBrief("Fade House, a barbershop in Chicago, IL.")).toEqual({
      city: "Chicago",
      state: "IL",
    });
    expect(placeFromBrief("Brakes and tires in McAllen, TX")).toEqual({
      city: "McAllen",
      state: "TX",
    });
    expect(placeFromBrief("We clean homes around St. Louis, MO")).toEqual({
      city: "St. Louis",
      state: "MO",
    });
  });
});

describe("service area and hours", () => {
  it("reads the service area and cuts it at 120 characters on a word", () => {
    expect(
      serviceAreaFromBrief(
        brief({ what: "Repairs", serviceArea: "Austin, Round Rock and Cedar Park" }),
      ),
    ).toBe("Austin, Round Rock and Cedar Park");
    const long =
      "St. Paul, Minneapolis, Roseville, Maplewood, Woodbury, Eagan, Burnsville, Bloomington, Edina, Richfield, Golden Valley and Plymouth";
    const area = serviceAreaFromBrief(brief({ what: "Repairs", serviceArea: long }));
    expect(area?.length).toBeLessThanOrEqual(120);
    expect(long.startsWith(area ?? "?")).toBe(true);
    expect(area).toMatch(/[A-Za-z]$/);
    expect(cutAtWord("one two three", 9)).toBe("one two");
  });

  it("reads hours with days and times, and skips the rest", () => {
    expect(
      hoursFromBrief("Open Mon–Fri 8 AM – 6 PM, Sat 9 AM – 2 PM. Closed Sunday. Call anytime."),
    ).toEqual([
      { days: "Mon–Fri", time: "8 AM – 6 PM" },
      { days: "Sat", time: "9 AM – 2 PM" },
      { days: "Sunday", time: "Closed" },
    ]);
    expect(hoursFromBrief("Monday to Friday, 8 to 6.")).toEqual([
      { days: "Monday to Friday", time: "8 to 6" },
    ]);
    expect(hoursFromBrief("Plumbing repairs in Austin. 24/7 emergency service.")).toBeUndefined();
    // Telefone não é horário.
    expect(hoursFromBrief("Open Mon–Fri, call 512-555-0142.")).toBeUndefined();
  });
});

describe("what the owner does", () => {
  it("is the first paragraph without the labeled sentences", () => {
    const text = brief({
      name: "Joe's Plumbing",
      what: "Plumbing repairs, drain cleaning and water heater installs",
      city: "Austin",
      state: "TX",
      serviceArea: "Austin and Round Rock",
      phone: "512-555-0142",
      details: "We have been around for a while.",
    });
    expect(whatFromBrief(text)).toBe("Plumbing repairs, drain cleaning and water heater installs.");
    expect(whatFromBrief("Joe's Plumbing in Austin, TX. Drains.")).toBeUndefined();
  });

  it("splits a list of services and title-cases it", () => {
    expect(servicesFromWhat("Plumbing repairs, drain cleaning and water heater installs.")).toEqual(
      ["Plumbing Repairs", "Drain Cleaning", "Water Heater Installs"],
    );
    expect(servicesFromWhat("We do HVAC repair; duct cleaning\nthermostat installs")).toEqual([
      "HVAC Repair",
      "Duct Cleaning",
      "Thermostat Installs",
    ]);
    expect(servicesFromWhat("Fades & beard trims or kids cuts")).toEqual([
      "Fades",
      "Beard Trims",
      "Kids Cuts",
    ]);
  });

  it("keeps at most 8 services", () => {
    expect(servicesFromWhat("a1, b, c, d, e, f, g, h, i, j")).toEqual([]);
    expect(
      servicesFromWhat("Cuts, color, perms, braids, extensions, waxing, makeup, brows, lashes"),
    ).toHaveLength(8);
  });

  it.each([
    "Helping families buy and sell homes",
    "Family-owned bakery making sourdough and cakes",
    "Street tacos and burritos from our food truck",
    "Plumber",
    "Hair salon",
    "Yoga classes for all levels",
    "Serving Austin since 2009",
    "Chiropractic care for back and neck pain",
  ])("ignores a description that is not a list: %s", (what) => {
    expect(servicesFromWhat(what)).toEqual([]);
  });
});

describe("factsFromBrief", () => {
  it("reads every fact composeBrief writes", () => {
    const text = brief({
      name: "Valley Cuts",
      what: "Fades, beard trims and kids cuts",
      city: "McAllen",
      state: "tx",
      serviceArea: "McAllen, Edinburg and Mission",
      phone: "(956)555-0110",
      details: "Hours: Tue–Sat 9 AM – 7 PM. Email cuts@valley.example.com.",
    });
    expect(factsFromBrief(text)).toEqual({
      name: "Valley Cuts",
      phone: "(956) 555-0110",
      email: "cuts@valley.example.com",
      city: "McAllen",
      state: "TX",
      serviceArea: "McAllen, Edinburg and Mission",
      hours: [{ days: "Tue–Sat", time: "9 AM – 7 PM" }],
    });
  });
});
