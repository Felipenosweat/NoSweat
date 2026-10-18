// Auditoria do site no ar: prints (celular e computador) + erros de console, falhas de rede
// e rolagem horizontal. Roda só no GitHub Actions (workflow site-audit.yml).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "https://nosweatfd.com";
const PAGES = ["/", "/create", "/pricing", "/login", "/signup", "/terms", "/privacy", "/credits", "/examples/joes-plumbing", "/examples/glow-salon", "/examples/rosas-kitchen", "/examples/hale-ortiz", "/examples/sparkle-cleaning", "/examples/vega-photo", "/dashboard"];
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const OUT = process.env.OUT_DIR ?? "qa/out";
mkdirSync(OUT, { recursive: true });
const report = [];
const browser = await chromium.launch();

// SEED=1 (só no app rodando localmente, sem login): cria um site, publica, manda um pedido de
// contato e enche o mês do Instagram, para as telas de dentro da conta terem conteúdo.
if (process.env.SEED === "1") {
  const api = await browser.newContext();
  const post = async (path, body) => {
    const res = await api.request.post(BASE + path, { data: body });
    const text = await res.text();
    console.log(`seed ${path} → ${res.status()}`);
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };
  const gen = await post("/api/sites/generate", {
    brief: "Sparkle & Co. Cleaning: weekly and move-out house cleaning in Worcester, MA. Call (508) 555-0142.",
  });
  const id = gen.siteId;
  if (id) {
    await post(`/api/sites/${id}/publish`, {});
    await post(`/api/sites/${id}/leads`, {
      name: "Maria Chen",
      email: "maria.chen@example.com",
      phone: "(508) 555-0187",
      message: "Move-out clean for a 3-bedroom on Oct 30. Can you send a quote?",
    });
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    const month = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    await post("/api/social/plan", { month, postsPerWeek: 3 });
    PAGES.push(`/sites/${id}`, `/sites/${id}/edit`, "/clients", "/social", "/social/review", "/billing", "/admin");
  }
  await api.close();
}
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
      const slug = path === "/" ? "-home" : path.replaceAll("/", "-");
      if (path === "/") {
        // Rola como uma pessoa (as animações aparecem com a rolagem) e tira um print por tela.
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        let shot = 0;
        for (let y = 0; y < total && shot < 60; y += vp.height) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(900);
          await page.screenshot({ path: `${OUT}/${vp.name}-home-scroll-${String(shot).padStart(2, "0")}.png` });
          shot += 1;
        }
        // Depois de rolar tudo: algo de tamanho razoável ainda invisível?
        const hidden = await page.evaluate(() =>
          [...document.querySelectorAll("main *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const st = getComputedStyle(el);
              return r.width > 120 && r.height > 40 && (st.opacity === "0" || st.visibility === "hidden");
            })
            .slice(0, 15)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
        );
        if (hidden.length) issues.push(`still invisible after scrolling: ${hidden.join(" | ")}`);
      } else {
        await page.screenshot({ path: `${OUT}/${vp.name}${slug}.png`, fullPage: true });
      }
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
