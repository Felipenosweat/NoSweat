import { MODEL_LIBRARY, fixtures } from "@nosweat/fixtures";
import type { Theme } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { luminance } from "../../theme";
import {
  VARIANT_OF,
  actionColors,
  foodIconKey,
  smsHref,
  tradeIconKey,
  workShapes,
} from "./variant-data";

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe("tradeIconKey", () => {
  it("picks the trade icon by keyword, with a neutral fallback", () => {
    expect(tradeIconKey("Water heaters")).toBe("heater");
    expect(tradeIconKey("Drain cleaning")).toBe("drain");
    expect(tradeIconKey("Slab leak detection")).toBe("drain");
    expect(tradeIconKey("Repiping")).toBe("pipe");
    expect(tradeIconKey("Deep cleaning")).toBe("broom");
    expect(tradeIconKey("Move-in / move-out")).toBe("broom");
    expect(tradeIconKey("Lawn mowing")).toBe("leaf");
    expect(tradeIconKey("Panel upgrades")).toBe("bolt");
    expect(tradeIconKey("Interior painting")).toBe("roller");
    expect(tradeIconKey("Emergency repairs")).toBe("wrench");
    expect(tradeIconKey("Something else")).toBe("wrench");
  });
});

describe("foodIconKey", () => {
  it("picks a cup, a flame, a cake or the utensils", () => {
    expect(foodIconKey("Iced latte")).toBe("cup");
    expect(foodIconKey("Smoked brisket plate")).toBe("flame");
    expect(foodIconKey("Chocolate cake")).toBe("cake");
    expect(foodIconKey("Fish tacos")).toBe("utensils");
  });
});

describe("smsHref", () => {
  it("keeps only digits and the plus sign", () => {
    expect(smsHref("(512) 555-0142")).toBe("sms:5125550142");
  });
});

describe("workShapes", () => {
  it("fills the 2-column phone grid and the 6-column desktop grid for any photo count", () => {
    for (let count = 1; count <= 24; count++) {
      const shapes = workShapes(count);
      expect(shapes, `count ${count}`).toHaveLength(count);
      let phone = 0;
      let desktop = 0;
      for (const shape of shapes) {
        phone += shape.m === "full" ? 2 : 1;
        desktop += shape.d;
        expect(phone, `phone ${count}`).toBeLessThanOrEqual(2);
        expect(desktop, `desktop ${count}`).toBeLessThanOrEqual(6);
        if (phone === 2) phone = 0;
        if (desktop === 6) desktop = 0;
      }
      expect(phone, `phone ${count}`).toBe(0);
      expect(desktop, `desktop ${count}`).toBe(0);
    }
  });
});

describe("actionColors", () => {
  const theme: Theme = {
    primary: "#17324D",
    secondary: "#C2410C",
    background: "#F4F7FA",
    text: "#101A26",
    font: "bold",
  };

  it("uses the accent for trades and portfolios when it stands out and reads well", () => {
    expect(actionColors("trade", theme).action).toBe("#C2410C");
    expect(actionColors("work", theme).action).toBe("#C2410C");
  });

  it("keeps the primary color for the other templates", () => {
    expect(actionColors("food", theme).action).toBe("#17324D");
    expect(actionColors("pro", theme).action).toBe("#17324D");
    expect(actionColors("beauty", theme).action).toBe("#17324D");
  });

  it("falls back to the primary color when the accent is too pale", () => {
    const pale = { ...theme, secondary: "#FDE68A" };
    expect(actionColors("trade", pale).action).toBe(theme.primary);
  });

  it("always gives a readable button, for every model site and library model", () => {
    const themes = [...Object.values(fixtures), ...MODEL_LIBRARY.map((entry) => entry.spec)];
    for (const spec of themes) {
      const { action, on } = actionColors(VARIANT_OF[spec.template], spec.theme);
      // O pior caso de "claro ou escuro, o que contrastar mais" fica em torno de 4,4:1.
      expect(contrast(action, on), spec.business.name).toBeGreaterThanOrEqual(4.3);
    }
  });
});
