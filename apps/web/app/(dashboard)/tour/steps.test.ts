import { describe, expect, it } from "vitest";
import {
  nextAfterMissing,
  remapStepIndex,
  spotlightSteps,
  stepCopy,
  stepCounter,
  viewportFor,
} from "./steps";

const ids = (viewport: "desktop" | "mobile") => spotlightSteps(viewport).map((step) => step.id);

describe("spotlightSteps (desktop)", () => {
  it("walks Home, then each menu item followed by its page, then help", () => {
    expect(ids("desktop")).toEqual([
      "home-actions",
      "nav-new",
      "home-money",
      "home-today",
      "site-edit",
      "nav-clients",
      "clients-add",
      "nav-schedule",
      "schedule-new",
      "nav-estimates",
      "estimates-new",
      "nav-invoices",
      "invoices-new",
      "nav-social",
      "nav-reviews",
      "nav-settings",
      "nav-help",
    ]);
  });

  it("points nav steps at the sidebar items", () => {
    const steps = spotlightSteps("desktop");
    const clients = steps.find((step) => step.id === "nav-clients");
    expect(clients?.targets.map((t) => t.id)).toEqual(["nav-clients"]);
  });

  it("opens each page before pointing at its button", () => {
    const steps = spotlightSteps("desktop");
    const route = (id: string) => steps.find((step) => step.id === id)?.route;
    expect(route("home-money")).toBe("/dashboard");
    expect(route("clients-add")).toBe("/clients");
    expect(route("schedule-new")).toBe("/schedule");
    expect(route("estimates-new")).toBe("/estimates");
    expect(route("invoices-new")).toBe("/invoices");
  });

  it("stays on the current page for menu steps (no extra page loads)", () => {
    const steps = spotlightSteps("desktop");
    for (let i = 1; i < steps.length; i += 1) {
      const step = steps[i];
      if (step?.id.startsWith("nav-")) expect(step.route).toBe(steps[i - 1]?.route);
    }
  });
});

describe("spotlightSteps (mobile)", () => {
  it("uses the tab bar and folds everything in More into one step", () => {
    expect(ids("mobile")).toEqual([
      "home-actions",
      "nav-new",
      "home-money",
      "home-today",
      "site-edit",
      "nav-clients",
      "clients-add",
      "nav-schedule",
      "schedule-new",
      "tab-more",
      "estimates-new",
      "invoices-new",
    ]);
    const steps = spotlightSteps("mobile");
    expect(steps.find((s) => s.id === "nav-clients")?.targets[0]?.id).toBe("tab-clients");
    expect(steps.find((s) => s.id === "nav-schedule")?.targets[0]?.id).toBe("tab-schedule");
    const more = steps.find((s) => s.id === "tab-more");
    expect(more?.targets[0]?.id).toBe("tab-more");
    expect(more?.body).toMatch(/Website, Estimates, Invoices, Social/);
    expect(steps.find((s) => s.id === "nav-new")?.targets[0]?.id).toBe("tab-new");
  });
});

describe("copy", () => {
  const all = [...spotlightSteps("desktop"), ...spotlightSteps("mobile")];

  it("keeps every step short", () => {
    for (const step of all) {
      expect(step.title.length).toBeLessThanOrEqual(40);
      expect(step.body.length).toBeLessThanOrEqual(160);
      for (const target of step.targets) {
        if (target.body) expect(target.body.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it("never promises online payments or posting without approval", () => {
    const text = all
      .flatMap((s) => [
        s.title,
        s.body,
        ...s.targets.map((t) => `${t.title ?? ""} ${t.body ?? ""}`),
      ])
      .join(" ")
      .toLowerCase();
    expect(text).not.toMatch(/pay online|card payment|credit card/);
    expect(text).toContain("approve");
  });

  it("uses the fallback target's own text when that one shows up", () => {
    const site = spotlightSteps("desktop").find((s) => s.id === "site-edit");
    if (!site) throw new Error("missing step");
    expect(stepCopy(site, "site-edit").title).toBe(site.title);
    expect(stepCopy(site, "home-sites").title).toBe("Your website");
    expect(stepCopy(site, null)).toEqual({ title: site.title, body: site.body });
  });
});

describe("viewportFor", () => {
  it("switches at the sidebar breakpoint", () => {
    expect(viewportFor(1023)).toBe("mobile");
    expect(viewportFor(1024)).toBe("desktop");
    expect(viewportFor(390)).toBe("mobile");
  });
});

describe("remapStepIndex", () => {
  const desktop = spotlightSteps("desktop");
  const mobile = spotlightSteps("mobile");
  const at = (steps: typeof desktop, id: string) => steps.findIndex((s) => s.id === id);

  it("keeps the same step when it exists on both", () => {
    expect(remapStepIndex(desktop, mobile, at(desktop, "clients-add"))).toBe(
      at(mobile, "clients-add"),
    );
    expect(remapStepIndex(mobile, desktop, at(mobile, "invoices-new"))).toBe(
      at(desktop, "invoices-new"),
    );
  });

  it("maps a More item to the More step and back", () => {
    expect(remapStepIndex(desktop, mobile, at(desktop, "nav-social"))).toBe(at(mobile, "tab-more"));
    expect(remapStepIndex(mobile, desktop, at(mobile, "tab-more"))).toBe(
      at(desktop, "nav-estimates"),
    );
  });

  it("never goes out of range", () => {
    expect(remapStepIndex(desktop, mobile, 999)).toBe(mobile.length - 1);
    expect(remapStepIndex(desktop, [], 3)).toBe(0);
  });
});

describe("nextAfterMissing", () => {
  it("skips forward, finishing after the last step", () => {
    expect(nextAfterMissing(2, "forward", 5)).toEqual({ index: 3, direction: "forward" });
    expect(nextAfterMissing(4, "forward", 5)).toBe("finish");
  });

  it("skips backward, turning around at the first step", () => {
    expect(nextAfterMissing(2, "back", 5)).toEqual({ index: 1, direction: "back" });
    expect(nextAfterMissing(0, "back", 5)).toEqual({ index: 1, direction: "forward" });
    expect(nextAfterMissing(0, "back", 1)).toBe("finish");
  });
});

describe("stepCounter", () => {
  it("reads like “3 of 9”", () => {
    expect(stepCounter(2, 9)).toBe("3 of 9");
  });
});
