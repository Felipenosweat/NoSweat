import { describe, expect, it } from "vitest";
import { findPlace, nearbyPlaces, searchPlaces } from "./index";

describe("searchPlaces", () => {
  it("sugere pelo começo do nome, a mais populosa primeiro", () => {
    const names = searchPlaces("worc").map((p) => `${p.name}, ${p.state}`);
    expect(names[0]).toBe("Worcester, MA");
  });

  it("filtra pelo estado (do campo ou escrito no fim)", () => {
    expect(searchPlaces("springfield", "IL")[0]).toMatchObject({
      name: "Springfield",
      state: "IL",
    });
    expect(searchPlaces("springfield, mo")[0]).toMatchObject({ name: "Springfield", state: "MO" });
  });

  it("sem texto, mostra as maiores cidades do estado", () => {
    const top = searchPlaces("", "MA");
    expect(top[0]?.name).toBe("Boston");
    expect(top.every((p) => p.state === "MA")).toBe(true);
  });

  it("encontra towns da Nova Inglaterra e lugares não incorporados", () => {
    expect(findPlace("Shrewsbury", "MA")).not.toBeNull();
    expect(findPlace("bethesda", "md")).not.toBeNull();
    expect(findPlace("Atlantis", "MA")).toBeNull();
  });

  it("não quebra com texto estranho", () => {
    expect(searchPlaces("%%%")).toEqual(searchPlaces(""));
    expect(searchPlaces("zzzzzzzz")).toEqual([]);
  });
});

describe("nearbyPlaces", () => {
  it("sugere vizinhas perto da cidade, da mais perto para a mais longe", () => {
    const near = nearbyPlaces("Worcester", "MA");
    const names = near.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["Shrewsbury", "Auburn", "Holden"]));
    expect(names).not.toContain("Worcester");
    expect(near.map((p) => p.miles)).toEqual([...near.map((p) => p.miles)].sort((a, b) => a - b));
    expect(near.every((p) => p.miles <= 25)).toBe(true);
  });

  it("cidade desconhecida = lista vazia", () => {
    expect(nearbyPlaces("Nowhere", "TX")).toEqual([]);
  });
});
