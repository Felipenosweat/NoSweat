// Auditoria do site no ar: prints (celular e computador) + erros de console, falhas de rede
// e rolagem horizontal. Roda só no GitHub Actions (workflow site-audit.yml).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "https://nosweatfd.com";
const PAGES = [
  "/",
  "/create",
  "/pricing",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/credits",
  "/examples/joes-plumbing",
  "/examples/glow-salon",
  "/examples/rosas-kitchen",
  "/examples/hale-ortiz",
  "/examples/sparkle-cleaning",
  "/examples/vega-photo",
  "/examples/bright-spark-electric",
  "/examples/greenline-landscaping",
  "/examples/true-coat-painting",
  "/examples/fade-and-co-barbers",
  "/examples/polished-nail-studio",
  "/examples/still-water-spa",
  "/examples/arch-and-lash",
  "/examples/north-loop-coffee",
  "/examples/brick-oven-pizza",
  "/examples/smoke-and-rail-bbq",
  "/examples/sunrise-bakery",
  "/examples/mercer-law",
  "/examples/bayside-family-dental",
  "/examples/keystone-insurance",
  "/examples/open-door-counseling",
  "/examples/hollis-interiors",
  "/examples/iron-lotus-tattoo",
  "/examples/reel-north-films",
  "/examples/fieldwork-studio",
  "/dashboard",
];
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
    brief:
      "Sparkle & Co. Cleaning: weekly and move-out house cleaning in Worcester, MA. Call (508) 555-0142.",
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
    // Escritório: cliente, tabela de preços, equipe, serviço hoje, orçamento e fatura enviados.
    const client = (
      await post("/api/clients", {
        name: "Daniel Brooks",
        phone: "(508) 555-0123",
        email: "daniel.brooks@example.com",
        address: "42 Elm St, Worcester, MA",
        stage: "contacted",
      })
    ).client;
    await post("/api/office/price-items", { name: "Standard clean", unitPriceCents: 14000 });
    await post("/api/office/price-items", {
      name: "Move-out clean",
      unitPriceCents: 32000,
      unit: "each",
    });
    await post("/api/office/team", { name: "Ana Souza", role: "Cleaner", color: "teal" });
    const extraPages = ["/schedule", "/estimates", "/invoices", "/office/settings"];
    extraPages.push("/office/price-book", "/team", "/reviews", "/guide");
    if (client?.id) {
      const start = new Date();
      start.setUTCHours(18, 0, 0, 0);
      const end = new Date(start.getTime() + 2 * 3600 * 1000);
      const job = (
        await post("/api/office/jobs", {
          clientId: client.id,
          title: "Move-out clean, 3 bedrooms",
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          valueCents: 32000,
        })
      ).job;
      const lines = [
        { priceItemId: null, name: "Move-out clean", quantity: 1, unitPriceCents: 32000 },
        { priceItemId: null, name: "Inside oven", quantity: 1, unitPriceCents: 4500 },
      ];
      const estimate = (
        await post("/api/office/estimates", {
          clientId: client.id,
          title: "Move-out clean",
          items: lines,
          taxRateBps: 625,
        })
      ).estimate;
      const invoice = (
        await post("/api/office/invoices", {
          clientId: client.id,
          title: "Weekly cleaning, October",
          items: [
            { priceItemId: null, name: "Standard clean", quantity: 4, unitPriceCents: 14000 },
          ],
        })
      ).invoice;
      if (job?.id) extraPages.push(`/schedule/${job.id}`);
      if (estimate?.id) {
        await post(`/api/office/estimates/${estimate.id}/send`, {});
        extraPages.push(`/estimates/${estimate.id}`, `/q/${estimate.publicToken}`);
      }
      if (invoice?.id) {
        await post(`/api/office/invoices/${invoice.id}/send`, {});
        await post(`/api/office/invoices/${invoice.id}/payments`, {
          amountCents: 28000,
          method: "zelle",
        });
        extraPages.push(`/invoices/${invoice.id}`, `/i/${invoice.publicToken}`);
      }
    }
    PAGES.push(
      ...extraPages,
      `/sites/${id}`,
      `/sites/${id}/edit`,
      "/clients",
      "/social",
      "/social/review",
      "/billing",
      "/admin",
    );
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
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (overflow > 1) issues.push(`horizontal overflow: ${overflow}px`);
      const slug = path === "/" ? "-home" : path.replaceAll("/", "-");
      if (path === "/") {
        // Rola como uma pessoa (as animações aparecem com a rolagem) e tira um print por tela.
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        let shot = 0;
        for (let y = 0; y < total && shot < 60; y += vp.height) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(900);
          await page.screenshot({
            path: `${OUT}/${vp.name}-home-scroll-${String(shot).padStart(2, "0")}.png`,
          });
          shot += 1;
        }
        // Depois de rolar tudo: algo de tamanho razoável ainda invisível?
        const hidden = await page.evaluate(() =>
          [...document.querySelectorAll("main *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const st = getComputedStyle(el);
              return (
                r.width > 120 && r.height > 40 && (st.opacity === "0" || st.visibility === "hidden")
              );
            })
            .slice(0, 15)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
        );
        if (hidden.length) issues.push(`still invisible after scrolling: ${hidden.join(" | ")}`);
      } else {
        // Rola a página inteira antes do print: fotos com loading="lazy" só carregam perto da tela.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 120));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForLoadState("networkidle").catch(() => {});
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
// Tutorial com destaque: abre o painel, toca em "Show me around" e tira um print por passo.
if (process.env.SEED === "1") {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
      const start = page.getByRole("button", { name: /show me around/i });
      await start.waitFor({ timeout: 8000 });
      await start.click();
      for (let step = 0; step < 8; step += 1) {
        await page.waitForTimeout(1800);
        await page.screenshot({
          path: `${OUT}/${vp.name}-tour-${String(step).padStart(2, "0")}.png`,
        });
        const next = page.getByRole("button", { name: /^(next|finish)$/i });
        if (!(await next.count())) break;
        await next.first().click();
      }
    } catch (e) {
      report.push({ viewport: vp.name, path: "tour", issues: [`tour: ${e.message}`] });
    }
    await context.close();
  }
}
await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
