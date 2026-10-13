import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { PIN_ORDER, WORK_ORDERS } from "./work-orders";

// A ficha do hero tem que bater com o site de exemplo de verdade (fixtures): mesmo nome,
// telefone, título e botão. Se alguém mudar uma fixture, este teste avisa.
const plain = (text: string) => text.replaceAll("’", "'");

describe("WORK_ORDERS", () => {
  it.each(WORK_ORDERS)("$slug bate com a fixture", (order) => {
    const spec = fixtures[order.slug];
    const hero = spec.sections.find((section) => section.type === "hero");
    if (hero?.type !== "hero") throw new Error("fixture sem hero");
    const pinned = (pin: string) => {
      const segment = order.sentence.find((s) => typeof s !== "string" && s.pin === pin);
      return typeof segment === "string" || !segment ? "" : segment.text;
    };

    expect(plain(pinned("name"))).toBe(spec.business.name);
    expect(pinned("phone")).toBe(spec.business.phone);
    expect(plain(order.lands.headline)).toContain(hero.title);
    expect(plain(order.lands.offer)).toContain(hero.ctaLabel);
  });

  it("cada ficha tem os 5 pinos, na frase e nas duas capturas, dentro da imagem", () => {
    for (const order of WORK_ORDERS) {
      for (const pin of PIN_ORDER) {
        expect(order.sentence.some((s) => typeof s !== "string" && s.pin === pin)).toBe(true);
        for (const box of [order.desktop[pin], order.phone[pin]]) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.x + box.w).toBeLessThanOrEqual(100);
          expect(box.y + box.h).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
