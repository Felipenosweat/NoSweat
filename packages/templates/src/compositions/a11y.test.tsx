import { readFileSync } from "node:fs";
import { fixtures } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../SiteRenderer";
import { OPENING_SCRIPT } from "./Signature";

const css = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");

/** Corpo da regra CSS com exatamente este seletor. */
function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
}

const withButtons = (buttons: "pill" | "sharp" | "caps" | "line"): SiteSpec => {
  const spec = fixtures["joes-plumbing"];
  return { ...spec, design: { composition: "service-led", ...spec.design, buttons } };
};

describe("Skip to content", () => {
  it("é o primeiro item focável, antes do menu, e leva ao <main>", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    const firstFocusable = html.match(/<(a|button)\b[^>]*>/)?.[0] ?? "";
    expect(firstFocusable).toContain('href="#main"');
    expect(html.indexOf(">Skip to content</a>")).toBeLessThan(html.indexOf("ns-nav"));
    expect(html).toMatch(/<main id="main" tabindex="-1"/);
  });

  it("não existe nas miniaturas (sem âncoras)", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={fixtures["joes-plumbing"]} anchors={false} />,
    );
    expect(html).not.toContain("Skip to content");
    expect(html).not.toMatch(/<main[^>]*tabindex/);
  });
});

describe("botões no estilo line", () => {
  it.each(["pill", "sharp", "caps", "line"] as const)(
    "a ação principal continua cheia no estilo %s",
    (buttons) => {
      const html = renderToStaticMarkup(<SiteRenderer spec={withButtons(buttons)} />);
      expect(html).toContain(`data-buttons="${buttons}"`);
      // Toda ação principal leva uma cor de fundo...
      for (const tag of html.match(/<a [^>]*ns-btn-primary[^>]*>/g) ?? []) {
        if (tag.includes("ns-nav-cta")) continue; // o fundo do menu vem do CSS (abaixo)
        expect(tag).toMatch(/\bbg-ns-/);
      }
    },
  );

  it("...que o CSS do estilo line não apaga: só o secundário vira link", () => {
    expect(rule('.ns-site[data-buttons="line"] .ns-btn-primary')).not.toMatch(/background/);
    expect(rule('.ns-site[data-buttons="line"] .ns-btn-secondary')).toMatch(
      /background: transparent/,
    );
    expect(css).not.toMatch(/\[data-buttons="line"\][^{]*ns-btn-primary[^{]*,/);
    // O botão do menu (`ns-nav-btn`) é cheio em todos os estilos: nenhuma regra do estilo line o toca.
    expect(css).not.toMatch(/\[data-buttons="line"\][^{]*ns-nav-btn/);
  });
});

describe("depoimentos que trocam sozinhos", () => {
  it("trazem o botão Pause/Play escondido (o Motion.tsx só mostra quando a troca começa)", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    const button = html.match(/<button[^>]*data-ns-quotes-toggle[^>]*>/)?.[0] ?? "";
    expect(button).toContain('type="button"');
    expect(button).toContain("hidden");
    expect(html).toContain("Pause testimonials");
    expect(html).toContain("Play testimonials");
  });

  it("sem botão quando há um depoimento só (nada troca)", () => {
    const base = fixtures["joes-plumbing"];
    const spec: SiteSpec = {
      ...base,
      sections: base.sections.map((section) =>
        section.type === "testimonials"
          ? { ...section, items: section.items.slice(0, 1) }
          : section,
      ),
    };
    expect(renderToStaticMarkup(<SiteRenderer spec={spec} />)).not.toContain(
      "data-ns-quotes-toggle",
    );
  });
});

describe("abertura (cortina)", () => {
  it("o script vem antes da cortina, só no site de verdade", () => {
    const spec = fixtures["joes-plumbing"];
    const live = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(live.indexOf("<script>")).toBeGreaterThan(-1);
    expect(live.indexOf("<script>")).toBeLessThan(live.indexOf("ns-intro"));
    for (const html of [
      renderToStaticMarkup(<SiteRenderer spec={spec} editable />),
      renderToStaticMarkup(<SiteRenderer spec={spec} anchors={false} />),
    ]) {
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("ns-intro");
    }
  });

  it("sem o atributo do script, a cortina nem aparece (sem JavaScript nada fica escondido)", () => {
    expect(rule(".ns-site .ns-intro")).toMatch(/display: none/);
    expect(css).toContain(".ns-site [data-ns-opening] > .ns-intro {");
  });

  /** Roda o script com um navegador de mentira; devolve se a cortina foi ligada. */
  function run({
    seen = new Map<string, string>(),
    reduce = false,
    storage = true,
  }: { seen?: Map<string, string>; reduce?: boolean; storage?: boolean } = {}) {
    const attrs = new Set<string>();
    const document = {
      currentScript: { parentElement: { setAttribute: (name: string) => attrs.add(name) } },
    };
    const sessionStorage = {
      getItem: (key: string) => {
        if (!storage) throw new Error("SecurityError");
        return seen.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (!storage) throw new Error("QuotaExceededError");
        seen.set(key, value);
      },
    };
    const matchMedia = () => ({ matches: reduce });
    const location = { pathname: "/s/joes-plumbing" };
    new Function("document", "sessionStorage", "matchMedia", "location", OPENING_SCRIPT)(
      document,
      sessionStorage,
      matchMedia,
      location,
    );
    return attrs.has("data-ns-opening");
  }

  it("toca uma vez por sessão", () => {
    const seen = new Map<string, string>();
    expect(run({ seen })).toBe(true);
    expect(run({ seen })).toBe(false);
  });

  it("nunca com reduzir movimento nem com sessionStorage bloqueado", () => {
    expect(run({ reduce: true })).toBe(false);
    expect(run({ storage: false })).toBe(false);
  });
});
