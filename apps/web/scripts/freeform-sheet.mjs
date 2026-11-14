#!/usr/bin/env node
// EXPERIMENTO "caminho A": folha de prints lado a lado das páginas em .freeform-samples/,
// para o dono julgar a variedade. Cada página abre no MESMO sandbox da prévia
// (<iframe sandbox="allow-scripts" srcdoc>, sem allow-same-origin) em 1440 px e 390 px.
//
// Uso (de dentro de apps/web):
//   node scripts/freeform-sheet.mjs                 # todas as páginas, 2 telas de cada largura
//   node scripts/freeform-sheet.mjs --screens 3     # 3 telas (rolando dentro da página)
//   node scripts/freeform-sheet.mjs --dir <pasta> --out <arquivo.png>
// Saída padrão: .freeform-samples/_sheet/contact-sheet.png (+ os prints soltos na mesma pasta).
//
// Usa o Playwright já instalado (local ou global, como o screenshot.mjs da Skill
// premium-web-design); não instala nada. Variáveis: PLAYWRIGHT_MODULE, CHROMIUM_PATH.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, scale: 0.3 },
  { name: "phone", width: 390, height: 844, scale: 0.5 },
];

function parseArgs(argv) {
  const options = { dir: path.join(here, "..", ".freeform-samples"), out: null, screens: 2 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") options.dir = path.resolve(argv[++i]);
    else if (arg === "--out") options.out = path.resolve(argv[++i]);
    else if (arg === "--screens") options.screens = Math.max(1, Number(argv[++i]) || 1);
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  options.out ??= path.join(options.dir, "_sheet", "contact-sheet.png");
  return options;
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
  console.error("Playwright not found (this script does not install it). Set PLAYWRIGHT_MODULE.");
  process.exit(1);
}

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Página anfitriã: só o iframe isolado, do tamanho exato da tela simulada. */
const hostPage = (html, { width, height }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}iframe{display:block;border:0}</style></head>
<body><iframe sandbox="allow-scripts" referrerpolicy="no-referrer" width="${width}" height="${height}" srcdoc="${escapeHtml(html)}"></iframe></body></html>`;

const options = parseArgs(process.argv.slice(2));
if (!existsSync(options.dir)) {
  console.error(`No samples folder at ${options.dir}. Run scripts/freeform-batch.mts first.`);
  process.exit(1);
}
const files = readdirSync(options.dir)
  .filter((file) => file.endsWith(".html"))
  .sort();
if (files.length === 0) {
  console.error(`No .html samples in ${options.dir}. Run scripts/freeform-batch.mts first.`);
  process.exit(1);
}

const shotsDir = path.dirname(options.out);
mkdirSync(shotsDir, { recursive: true });

const chromium = loadChromium();
const executablePath =
  process.env.CHROMIUM_PATH ??
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });

const columns = [];
for (const file of files) {
  const slug = file.slice(0, -".html".length);
  const html = readFileSync(path.join(options.dir, file), "utf8");
  const direction = /<!--\s*ns:direction:?\s*([\s\S]*?)-->/i.exec(html)?.[1]?.trim() ?? "";
  const column = { slug, direction, shots: {} };

  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (msg) => msg.type() === "error" && problems.push(msg.text()));
    await page.setContent(hostPage(html, viewport), { waitUntil: "load" });
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
    if (!frame) throw new Error(`${slug}: sandboxed frame did not load`);
    // Fontes do Google podem falhar sem rede: espera no máximo 5 s.
    await Promise.race([
      frame.evaluate(() => document.fonts.ready.then(() => true)),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    await page.waitForTimeout(1800); // sequência de entrada (GSAP)

    const element = await page.$("iframe");
    const shots = [];
    for (let screen = 0; screen < options.screens; screen++) {
      if (screen > 0) {
        // Rola dentro da página gerada (o Playwright entra no frame mesmo com origem opaca).
        await frame.evaluate(
          (y) => window.scrollTo({ top: y, behavior: "instant" }),
          screen * viewport.height,
        );
        await page.waitForTimeout(1200); // efeitos de entrada ao rolar
      }
      const buffer = await element.screenshot();
      const shotPath = path.join(shotsDir, `${slug}-${viewport.width}-${screen + 1}.png`);
      writeFileSync(shotPath, buffer);
      shots.push(buffer.toString("base64"));
    }
    column.shots[viewport.name] = shots;
    if (problems.length > 0) console.warn(`${slug} @${viewport.width}: ${problems.join(" | ")}`);
    await page.close();
  }
  columns.push(column);
  console.log(`captured ${slug}`);
}

// Folha: uma coluna por página (título, direção, telas do desktop ao lado das do celular).
const img = (data, width, height) =>
  `<img src="data:image/png;base64,${data}" width="${width}" height="${height}" alt="">`;
const desktop = VIEWPORTS[0];
const phone = VIEWPORTS[1];
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:32px;background:#e9e7e2;font:14px/1.4 system-ui,sans-serif;color:#1c1b19}
.row{display:flex;gap:32px;align-items:flex-start}
.col{background:#fff;padding:16px;border-radius:6px;width:${desktop.width * desktop.scale + phone.width * phone.scale + 16}px}
h2{margin:0 0 4px;font-size:18px}
p{margin:0 0 12px;font-size:12px;color:#4a4843;min-height:5.6em}
.shots{display:flex;gap:16px;align-items:flex-start}
.stack{display:flex;flex-direction:column;gap:6px}
.stack img{display:block;outline:1px solid #0002}
</style></head><body><div class="row">${columns
  .map(
    (
      column,
    ) => `<div class="col"><h2>${escapeHtml(column.slug)}</h2><p>${escapeHtml(column.direction)}</p>
<div class="shots"><div class="stack">${column.shots.desktop
      .map((data) => img(data, desktop.width * desktop.scale, desktop.height * desktop.scale))
      .join("")}</div><div class="stack">${column.shots.phone
      .map((data) => img(data, phone.width * phone.scale, phone.height * phone.scale))
      .join("")}</div></div></div>`,
  )
  .join("")}</div></body></html>`;

const sheetPage = await browser.newPage({
  viewport: { width: 1200, height: 800 },
  deviceScaleFactor: 2,
});
await sheetPage.setContent(sheet, { waitUntil: "load" });
await sheetPage.screenshot({ path: options.out, fullPage: true });
await browser.close();
console.log(`\nContact sheet: ${options.out}`);
