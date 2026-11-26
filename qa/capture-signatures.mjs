// Recaptura as fotos dos sites de exemplo usadas na landing (public/landing/signature/<slug>-d.webp
// e <slug>-m.webp) a partir do renderer ATUAL (/examples/<slug>), para a vitrine nunca ficar velha.
// Computador: 1280×800 com DPR 2 (2560×1600, 16:10). Celular: 390×844 com DPR 3 (1170×2532).
// Esconde a etiqueta "Fictional example" da página de exemplo e liga "reduzir movimento" (tudo
// parado e visível). O PNG da captura vira WebP (qualidade 0.85) no próprio Chromium, sem
// dependência nova.
//
// Uso (com o app rodando, ex.: AI_PROVIDER=mock pnpm --filter @nosweat/web start -p 3466):
//   BASE_URL=http://localhost:3466 node qa/capture-signatures.mjs smoke-and-rail-bbq sunrise-bakery
// Sem slugs, recaptura os que a landing usa hoje (LANDING_SLUGS abaixo).
// PLAYWRIGHT_MODULE aponta para outro playwright se ele não estiver instalado no projeto.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const playwright = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
// Pacote CommonJS importado de fora do projeto: o objeto vem em `default`.
const { chromium } = playwright.chromium ? playwright : playwright.default;

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../apps/web/public/landing/signature");
const LANDING_SLUGS = [
  "brick-oven-pizza",
  "sunrise-bakery",
  "north-loop-coffee",
  "greenline-landscaping",
  "fade-and-co-barbers",
];
const slugs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : LANDING_SLUGS;

const SHOTS = [
  { suffix: "d", viewport: { width: 1280, height: 800 }, scale: 2, mobile: false },
  { suffix: "m", viewport: { width: 390, height: 844 }, scale: 3, mobile: true },
];

const browser = await chromium.launch();
for (const slug of slugs) {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: shot.scale,
      isMobile: shot.mobile,
      hasTouch: shot.mobile,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/examples/${slug}`, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: 'aside[aria-label="About this example"] { display: none !important; }',
    });
    // Espera as fotos do topo e as fontes.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((img) => img.getBoundingClientRect().top < innerHeight)
          .map((img) => (img.complete ? null : img.decode().catch(() => null))),
      );
    });
    await page.waitForTimeout(800);
    const png = await page.screenshot({ type: "png" });
    // PNG → WebP no canvas do próprio navegador.
    const webp = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return canvas.toDataURL("image/webp", 0.85).split(",")[1];
    }, png.toString("base64"));
    const file = join(OUT, `${slug}-${shot.suffix}.webp`);
    writeFileSync(file, Buffer.from(webp, "base64"));
    console.log(`${file} (${Math.round(Buffer.from(webp, "base64").length / 1024)} KB)`);
    await context.close();
  }
}
await browser.close();
