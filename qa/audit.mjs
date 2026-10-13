// Auditoria do site no ar: prints (celular e computador) + erros de console, falhas de rede
// e rolagem horizontal. Roda só no GitHub Actions (workflow site-audit.yml).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "https://nosweatfd.com";
const PAGES = ["/", "/create", "/pricing", "/login", "/signup", "/terms", "/privacy", "/credits", "/examples/joes-plumbing", "/dashboard"];
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const OUT = process.env.OUT_DIR ?? "qa/out";
mkdirSync(OUT, { recursive: true });
const report = [];
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const path of PAGES) {
    const page = await context.newPage();
    const issues = [];
    page.on("console", (m) => m.type() === "error" && issues.push(`console: ${m.text()}`));
    page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
    page.on("response", (r) => r.status() >= 400 && issues.push(`HTTP ${r.status()} ${r.url()}`));
    page.on("requestfailed", (r) => issues.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
    let status = 0;
    try {
      const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      status = res?.status() ?? 0;
      await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) issues.push(`horizontal overflow: ${overflow}px`);
      const file = `${OUT}/${vp.name}${path === "/" ? "-home" : path.replaceAll("/", "-")}.png`;
      await page.screenshot({ path: file, fullPage: true });
    } catch (e) {
      issues.push(`navigation: ${e.message}`);
    }
    report.push({ viewport: vp.name, path, finalUrl: page.url(), status, issues });
    await page.close();
  }
  await context.close();
}
await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
