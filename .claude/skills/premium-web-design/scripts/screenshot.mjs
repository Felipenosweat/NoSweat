#!/usr/bin/env node
// Prints de várias larguras de tela para a revisão visual (Skill premium-web-design).
//
// Uso:
//   node .claude/skills/premium-web-design/scripts/screenshot.mjs [opções] <rota> [rota...]
//   node .claude/skills/premium-web-design/scripts/screenshot.mjs / /create /examples/joes-plumbing
//
// Opções:
//   --base <url>      Endereço do app (padrão: http://localhost:3000)
//   --out <pasta>     Onde salvar (padrão: .design-shots/<data-hora>)
//   --widths <lista>  Larguras separadas por vírgula (padrão: 390,768,1440)
//
// Precisa do Playwright (pacote "playwright" ou "playwright-core") instalado no projeto ou
// globalmente (`npm i -g playwright && npx playwright install chromium`).
// Variáveis opcionais: PLAYWRIGHT_MODULE (caminho do pacote), CHROMIUM_PATH (executável).

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

function parseArgs(argv) {
  const options = { base: "http://localhost:3000", out: null, widths: [390, 768, 1440] };
  const routes = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base") options.base = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else if (arg === "--widths") options.widths = argv[++i].split(",").map(Number);
    else routes.push(arg);
  }
  if (routes.length === 0) routes.push("/");
  options.out ??= path.join(".design-shots", new Date().toISOString().replace(/[:.]/g, "-"));
  return { options, routes };
}

function loadChromium() {
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
  console.error(
    "Playwright não encontrado. Instale com: npm i -g playwright && npx playwright install chromium",
  );
  process.exit(1);
}

const slug = (route) => route.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";

const { options, routes } = parseArgs(process.argv.slice(2));
const chromium = loadChromium();
const executablePath =
  process.env.CHROMIUM_PATH ??
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
mkdirSync(options.out, { recursive: true });

const report = [];
for (const route of routes) {
  for (const width of options.widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 } });
    const problems = [];
    page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
    page.on(
      "response",
      (res) => res.status() >= 400 && problems.push(`${res.status()} ${res.url()}`),
    );

    await page.goto(new URL(route, options.base).toString(), { waitUntil: "networkidle" });
    // Rola a página toda para carregar conteúdo "lazy" (iframes, imagens).
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) problems.push(`horizontal overflow: ${overflow}px`);

    const base = path.join(options.out, `${slug(route)}-${width}`);
    await page.screenshot({ path: `${base}-top.png` });
    await page.screenshot({ path: `${base}-full.png`, fullPage: true });
    report.push({ route, width, files: [`${base}-top.png`, `${base}-full.png`], problems });
    await page.close();
  }
}
await browser.close();

writeFileSync(path.join(options.out, "report.json"), JSON.stringify(report, null, 2));
for (const entry of report) {
  const status = entry.problems.length ? `⚠ ${entry.problems.length} problem(s)` : "ok";
  console.log(`${entry.route} @ ${entry.width}px: ${status}`);
  for (const problem of entry.problems) console.log(`   - ${problem}`);
}
console.log(`\nScreenshots: ${options.out}`);
