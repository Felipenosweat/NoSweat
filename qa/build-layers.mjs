// Gera as 4 camadas da animação "o site se montando" da landing (public/landing/build/*.webp)
// a partir do site de exemplo Sparkle & Co. no ar, num quadro 1280×860 (mesmas caixas do
// LAYERS em components/landing/BuildSequence.tsx). Saída em PNG; a conversão é feita depois.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "https://nosweatfd.com";
const OUT = process.env.OUT_DIR ?? "qa/out";
const W = 1280;
const H = 860;
const LAYERS = {
  header: { x: 0, y: 0, w: 100, h: 14.07 },
  text: { x: 7.5, y: 31.22, w: 45.63, h: 51.05 },
  photo: { x: 57.5, y: 14.07, w: 42.5, h: 63.26 },
  hours: { x: 53.75, y: 64.3, w: 30, h: 28.6 },
};

mkdirSync(`${OUT}/build`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 1400 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}/examples/sparkle-cleaning`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
// Topo do site do cliente (abaixo da faixa "Fictional example" da página de exemplo).
const top = await page.evaluate(() => {
  const root = document.querySelector("#top");
  return root ? root.getBoundingClientRect().top + window.scrollY : 0;
});
await page.screenshot({ path: `${OUT}/build/frame.png`, clip: { x: 0, y: top, width: W, height: H } });
for (const [name, b] of Object.entries(LAYERS)) {
  await page.screenshot({
    path: `${OUT}/build/${name}.png`,
    clip: { x: (b.x / 100) * W, y: top + (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H },
  });
}
await browser.close();
console.log("layers done, site top at", top);
