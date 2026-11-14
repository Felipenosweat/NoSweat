// EXPERIMENTO "caminho A": abre uma página gerada no MESMO sandbox da prévia
// (<iframe sandbox="allow-scripts" srcdoc>, sem allow-same-origin) e tira prints espalhados pela
// página inteira, no desktop e no celular, para a IA criticar a própria página (segunda passada).
// Também acha problemas objetivos: erros de JS, rolagem lateral e <h1> invisível.
// Usa o Playwright já instalado (local ou global); não instala nada.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const RENDER_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, shots: 6 },
  { name: "phone", width: 390, height: 844, shots: 4 },
];

export function loadChromium() {
  const require = createRequire(import.meta.url);
  const candidates = [process.env.PLAYWRIGHT_MODULE, "playwright", "playwright-core"].filter(
    Boolean,
  );
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    candidates.push(path.join(globalRoot, "playwright"), path.join(globalRoot, "playwright-core"));
  } catch {
    // npm indisponível: segue só com os candidatos locais.
  }
  for (const candidate of candidates) {
    try {
      return require(candidate).chromium;
    } catch {
      // tenta o próximo
    }
  }
  throw new Error("Playwright not found (this script does not install it). Set PLAYWRIGHT_MODULE.");
}

export async function launchBrowser() {
  const chromium = loadChromium();
  const executablePath =
    process.env.CHROMIUM_PATH ??
    (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  return chromium.launch({ executablePath });
}

const escapeAttr = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Página anfitriã: só o iframe isolado, do tamanho exato da tela simulada. */
export const hostPage = (html, { width, height }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}iframe{display:block;border:0}</style></head>
<body><iframe sandbox="allow-scripts" referrerpolicy="no-referrer" width="${width}" height="${height}" srcdoc="${escapeAttr(html)}"></iframe></body></html>`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Prints JPEG (base64) espalhados do topo ao fim da página em cada largura + problemas achados.
 * A rolagem é feita aos poucos (como uma pessoa) para os efeitos de entrada rodarem.
 */
export async function renderShots(browser, html) {
  const screenshots = [];
  const problems = [];
  for (const viewport of RENDER_VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const errors = new Set();
    page.on("pageerror", (error) => errors.add(error.message));
    page.on("console", (msg) => msg.type() === "error" && errors.add(msg.text()));
    await page.setContent(hostPage(html, viewport), { waitUntil: "load" });
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
    if (!frame) throw new Error("sandboxed frame did not load");
    await Promise.race([frame.evaluate(() => document.fonts.ready.then(() => true)), wait(5000)]);
    await wait(1800); // sequência de entrada

    const total = await frame.evaluate(() => document.documentElement.scrollHeight);
    const maxTop = Math.max(0, total - viewport.height);
    const count = Math.min(viewport.shots, Math.max(1, Math.ceil(total / viewport.height)));
    const element = await page.$("iframe");
    let current = 0;
    for (let i = 0; i < count; i++) {
      const target = count === 1 ? 0 : Math.round((maxTop * i) / (count - 1));
      // Rola em passos de meia tela até o alvo, para disparar ScrollTrigger no caminho.
      while (current !== target) {
        current =
          target > current
            ? Math.min(target, current + viewport.height / 2)
            : Math.max(target, current - viewport.height / 2);
        await frame.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), current);
        await wait(120);
      }
      await wait(1100);
      const buffer = await element.screenshot({ type: "jpeg", quality: 78 });
      screenshots.push({ mediaType: "image/jpeg", base64: buffer.toString("base64") });
    }

    // Texto sobreposto sem querer: compara blocos de texto visíveis (folhas com texto próprio)
    // em cada posição de rolagem já visitada não dá; olhamos a página parada no topo e no fim.
    const overlaps = new Set();
    for (const top of [0, Math.round(maxTop / 2), maxTop]) {
      await frame.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await wait(900);
      const found = await frame.evaluate(() => {
        const blocks = [];
        for (const el of document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,dt,dd,label,a,span")) {
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!own) continue;
          const s = getComputedStyle(el);
          if (s.visibility === "hidden" || Number(s.opacity) < 0.3 || el.closest("[aria-hidden=true]")) continue;
          // Barra fixa e cabeçalho grudado passam por cima do conteúdo de propósito.
          let fixed = false;
          for (let p = el; p && p !== document.body; p = p.parentElement) {
            const pos = getComputedStyle(p).position;
            if (pos === "fixed" || pos === "sticky") { fixed = true; break; }
          }
          if (fixed) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) continue;
          blocks.push({ el, r });
        }
        const out = [];
        for (let i = 0; i < blocks.length; i++) {
          for (let j = i + 1; j < blocks.length; j++) {
            const a = blocks[i], b = blocks[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
            const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
            if (w > 8 && h > 6 && w * h > 0.2 * Math.min(a.r.width * a.r.height, b.r.width * b.r.height)) {
              const t = (e) => e.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
              out.push(`"${t(a.el)}" overlaps "${t(b.el)}"`);
            }
          }
        }
        return out.slice(0, 6);
      });
      for (const item of found) overlaps.add(item);
    }
    const label0 = `${viewport.name} ${viewport.width}px`;
    for (const item of [...overlaps].slice(0, 8)) problems.push(`${label0}: text overlap: ${item}`);

    const checks = await frame.evaluate(() => {
      const doc = document.documentElement;
      const h1 = document.querySelector("h1");
      const style = h1 ? getComputedStyle(h1) : null;
      return {
        overflow: doc.scrollWidth - window.innerWidth,
        h1: h1
          ? { opacity: Number(style.opacity), visible: style.visibility !== "hidden" }
          : null,
        tel: document.querySelectorAll('a[href^="tel:"]').length,
        form: document.querySelectorAll("form[data-ns-contact]").length,
      };
    });
    const label = `${viewport.name} ${viewport.width}px`;
    if (checks.overflow > 1) problems.push(`${label}: horizontal scroll of ${checks.overflow}px.`);
    if (!checks.h1) problems.push(`${label}: no <h1>.`);
    else if (checks.h1.opacity < 0.5 || !checks.h1.visible)
      problems.push(`${label}: the <h1> is invisible after load (an animation did not finish).`);
    if (checks.tel === 0) problems.push(`${label}: no tel: link.`);
    if (checks.form !== 1) problems.push(`${label}: expected one form[data-ns-contact].`);
    for (const error of errors) problems.push(`${label}: console error: ${error.slice(0, 200)}`);
    await page.close();
  }
  return { screenshots, problems };
}
