import { describe, expect, it } from "vitest";
import {
  ARROW_INSET,
  POPOVER_GAP,
  VIEWPORT_MARGIN,
  clampToViewport,
  isComfortablyVisible,
  isPhone,
  phoneDock,
  placePopover,
  ringRadius,
  ringRect,
  sameRect,
  zoomStartRect,
  type Rect,
} from "./placement";

const desktop = { width: 1440, height: 900 };
const popover = { width: 352, height: 200 };

const inside = (rect: { top: number; left: number }, size = popover, viewport = desktop) =>
  rect.top >= VIEWPORT_MARGIN &&
  rect.left >= VIEWPORT_MARGIN &&
  rect.top + size.height <= viewport.height - VIEWPORT_MARGIN &&
  rect.left + size.width <= viewport.width - VIEWPORT_MARGIN;

describe("placePopover", () => {
  it("goes to the right of a sidebar item, vertically centred, arrow on the item", () => {
    const ring: Rect = { top: 300, left: 18, width: 228, height: 44 };
    const placed = placePopover({ ring, popover, viewport: desktop });
    expect(placed.side).toBe("right");
    expect(placed.left).toBe(18 + 228 + POPOVER_GAP);
    expect(placed.top).toBe(Math.round(322 - 100));
    expect(placed.arrow).toBe(100);
    expect(inside(placed)).toBe(true);
  });

  it("goes below a wide target with no room on the right", () => {
    const ring: Rect = { top: 120, left: 300, width: 1120, height: 200 };
    const placed = placePopover({ ring, popover, viewport: desktop });
    expect(placed.side).toBe("bottom");
    expect(placed.top).toBe(120 + 200 + POPOVER_GAP);
    expect(inside(placed)).toBe(true);
  });

  it("goes above when the target sits at the bottom", () => {
    const ring: Rect = { top: 700, left: 300, width: 1120, height: 150 };
    const placed = placePopover({ ring, popover, viewport: desktop });
    expect(placed.side).toBe("top");
    expect(placed.top).toBe(700 - POPOVER_GAP - 200);
  });

  it("goes left when only the left side has room", () => {
    const ring: Rect = { top: 40, left: 1100, width: 320, height: 820 };
    const placed = placePopover({ ring, popover, viewport: desktop });
    expect(placed.side).toBe("left");
    expect(placed.left).toBe(1100 - POPOVER_GAP - 352);
    expect(inside(placed)).toBe(true);
  });

  it("stays inside the screen near the corners and keeps the arrow off the rounded corner", () => {
    const ring: Rect = { top: 4, left: 18, width: 200, height: 40 };
    const placed = placePopover({ ring, popover, viewport: desktop });
    expect(placed.side).toBe("right");
    expect(placed.top).toBe(VIEWPORT_MARGIN);
    expect(placed.arrow).toBeGreaterThanOrEqual(ARROW_INSET);
    expect(placed.arrow).toBeLessThanOrEqual(popover.height - ARROW_INSET);
  });

  it("picks the roomiest side and clamps when nothing fits", () => {
    const small = { width: 500, height: 400 };
    const ring: Rect = { top: 20, left: 20, width: 460, height: 360 };
    const placed = placePopover({ ring, popover, viewport: small });
    expect(placed.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(placed.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(placed.left + popover.width).toBeLessThanOrEqual(small.width);
  });
});

describe("ringRect / zoomStartRect", () => {
  it("pads the target and keeps it on screen", () => {
    expect(ringRect({ top: 100, left: 100, width: 50, height: 20 }, desktop)).toEqual({
      top: 94,
      left: 94,
      width: 62,
      height: 32,
    });
    const huge = ringRect({ top: -200, left: 0, width: 1440, height: 2000 }, desktop);
    expect(huge.top).toBe(4);
    expect(huge.top + huge.height).toBe(desktop.height - 4);
  });

  it("starts the zoom bigger than the ring, around it, inside the screen", () => {
    const ring: Rect = { top: 300, left: 18, width: 228, height: 44 };
    const start = zoomStartRect(ring, desktop);
    expect(start.width).toBeGreaterThan(ring.width);
    expect(start.height).toBeGreaterThan(ring.height);
    expect(start.left).toBeGreaterThanOrEqual(0);
    expect(start.top).toBeLessThanOrEqual(ring.top);
    expect(start.top + start.height).toBeGreaterThanOrEqual(ring.top + ring.height);
    expect(start.left + start.width).toBeLessThanOrEqual(desktop.width);
  });

  it("rounds like a card without going past half the height", () => {
    expect(ringRadius({ top: 0, left: 0, width: 200, height: 300 })).toBe(20);
    expect(ringRadius({ top: 0, left: 0, width: 200, height: 30 })).toBe(15);
  });

  it("clamps to the viewport", () => {
    expect(clampToViewport({ top: -10, left: -10, width: 30, height: 30 }, desktop, 0)).toEqual({
      top: 0,
      left: 0,
      width: 20,
      height: 20,
    });
  });
});

describe("phoneDock", () => {
  const phone = { width: 390, height: 844 };
  const args = { popoverHeight: 220, viewport: phone, bottomOffset: 84 };

  it("is a phone below 640px", () => {
    expect(isPhone(phone)).toBe(true);
    expect(isPhone({ width: 800, height: 1000 })).toBe(false);
  });

  it("docks at the bottom when the target is higher up", () => {
    expect(phoneDock({ ...args, ring: { top: 200, left: 12, width: 366, height: 120 } })).toBe(
      "bottom",
    );
  });

  it("docks at the bottom for a tab bar item (below the card)", () => {
    expect(phoneDock({ ...args, ring: { top: 772, left: 300, width: 70, height: 52 } })).toBe(
      "bottom",
    );
  });

  it("moves to the top when the bottom card would cover the target", () => {
    expect(phoneDock({ ...args, ring: { top: 520, left: 12, width: 366, height: 100 } })).toBe(
      "top",
    );
  });
});

describe("isComfortablyVisible / sameRect", () => {
  it("knows when scrolling is needed", () => {
    expect(isComfortablyVisible({ top: 100, left: 0, width: 100, height: 100 }, desktop)).toBe(
      true,
    );
    expect(isComfortablyVisible({ top: 880, left: 0, width: 100, height: 100 }, desktop)).toBe(
      false,
    );
  });

  it("compares rects with half-pixel tolerance", () => {
    const a = { top: 1, left: 1, width: 10, height: 10 };
    expect(sameRect(a, { ...a, top: 1.2 })).toBe(true);
    expect(sameRect(a, { ...a, top: 3 })).toBe(false);
    expect(sameRect(null, a)).toBe(false);
  });
});
