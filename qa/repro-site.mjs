// Reproduz um site real do cliente (qa/repro-spec.json) no app rodando localmente e tira prints
// do que o visitante vê. Roda só no GitHub Actions (workflow repro-site.yml).
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "qa/out-repro";
mkdirSync(OUT, { recursive: true });
const spec = JSON.parse(readFileSync(new URL("./repro-spec.json", import.meta.url), "utf8"));

const browser = await chromium.launch();
const context = await browser.newContext();
const call = async (method, path, data) => {
  const res = await context.request.fetch(BASE + path, { method, data });
  const text = await res.text();
  console.log(`${method} ${path} → ${res.status()}`);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 300) };
  }
};
const gen = await call("POST", "/api/sites/generate", { brief: "Hair salon in Miami" });
const id = gen.siteId;
if (!id) throw new Error("no site: " + JSON.stringify(gen));
const saved = await call("PATCH", `/api/sites/${id}`, { spec });
if (!saved.siteId) throw new Error("spec rejected: " + JSON.stringify(saved));

const report = [];
for (const vp of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/sites/preview/${id}`, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const steps = Math.min(16, Math.ceil(total / (vp.height * 0.9)));
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(i * vp.height * 0.9));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${vp.name}-${String(i).padStart(2, "0")}.png` });
  }
  report.push({ viewport: vp.name, total, steps, errors });
  await page.close();
}
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
