import { describe, expect, it } from "vitest";
import { readBrief } from "./signals";

describe("readBrief industry", () => {
  // "Cater" só é comida com contexto de comida ou evento, e nunca em "cater to".
  it.each([
    ["House cleaning. We cater to busy families.", "cleaning"],
    ["Handyman who caters to seniors in Tampa, FL.", "trades"],
    ["Photographer catering to small businesses.", "creative"],
    ["We cater weddings", "food"],
    ["Catering for corporate events and parties", "food"],
    ["Our caterer team makes lunch platters", "food"],
  ])("%s → %s", (brief, industry) => {
    expect(readBrief(brief).industry).toBe(industry);
  });

  it.each([
    ["Dog grooming and nail trims", "beauty"],
    ["Mobile pet groomer in Tampa", "beauty"],
    ["Brakes, oil changes and engine work", "trades"],
    ["Auto body and car repair shop", "trades"],
    ["Furnace and heat pump installs", "trades"],
    ["Air conditioning repair", "trades"],
    ["Roofing contractor", "trades"],
    ["Gateway Realty, homes in St. Louis", "professional"],
    ["Math tutoring and test prep", "professional"],
    ["Chiropractor for back pain", "wellness"],
    ["Acupuncturist in Portland", "wellness"],
    ["Yoga and pilates studio", "wellness"],
    ["Food truck with tacos", "food"],
  ])("%s → %s", (brief, industry) => {
    expect(readBrief(brief).industry).toBe(industry);
  });
});
