// Mede a velocidade das páginas com o Lighthouse (celular, rede 4G simulada) e grava um resumo
// por página em OUT_DIR/summary.json: nota de performance, LCP, CLS, TBT, peso total e os maiores
// arquivos. Roda no GitHub Actions (perf.yml): páginas públicas no ar e as de dentro da conta no
// app local (sem login, DEV_USER).
import { mkdir, writeFile } from "node:fs/promises";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const OUT = process.env.OUT_DIR ?? "out-perf";
const TARGETS = JSON.parse(process.env.TARGETS ?? "[]");

await mkdir(OUT, { recursive: true });
const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ["--headless=new", "--no-sandbox"],
});
const summary = [];
for (const target of TARGETS) {
  for (const formFactor of ["mobile", "desktop"]) {
    try {
      const result = await lighthouse(target.url, {
        port: chrome.port,
        output: "json",
        onlyCategories: ["performance"],
        formFactor,
        screenEmulation:
          formFactor === "desktop"
            ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }
            : undefined,
        throttlingMethod: "simulate",
      });
      const lhr = result.lhr;
      const audit = (id) => lhr.audits[id];
      const items = audit("network-requests")?.details?.items ?? [];
      const biggest = [...items]
        .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
        .slice(0, 8)
        .map((item) => ({ url: item.url, kb: Math.round((item.transferSize ?? 0) / 1024) }));
      const entry = {
        name: target.name,
        url: target.url,
        formFactor,
        score: Math.round((lhr.categories.performance.score ?? 0) * 100),
        lcpMs: Math.round(audit("largest-contentful-paint")?.numericValue ?? 0),
        fcpMs: Math.round(audit("first-contentful-paint")?.numericValue ?? 0),
        tbtMs: Math.round(audit("total-blocking-time")?.numericValue ?? 0),
        cls: Number((audit("cumulative-layout-shift")?.numericValue ?? 0).toFixed(3)),
        ttfbMs: Math.round(audit("server-response-time")?.numericValue ?? 0),
        totalKb: Math.round((audit("total-byte-weight")?.numericValue ?? 0) / 1024),
        jsKb: Math.round(
          items
            .filter((item) => item.resourceType === "Script")
            .reduce((sum, item) => sum + (item.transferSize ?? 0), 0) / 1024,
        ),
        lcpElement: audit("largest-contentful-paint-element")?.details?.items?.[0]?.items?.[0]?.node
          ?.snippet,
        opportunities: Object.values(lhr.audits)
          .filter((a) => a.details?.type === "opportunity" && (a.numericValue ?? 0) > 100)
          .map((a) => ({ id: a.id, savingsMs: Math.round(a.numericValue) })),
        biggest,
      };
      summary.push(entry);
      console.log(`${target.name} ${formFactor}: ${entry.score} LCP ${entry.lcpMs}ms`);
    } catch (error) {
      summary.push({ name: target.name, url: target.url, formFactor, error: String(error) });
      console.warn("lighthouse failed", target.url, String(error));
    }
  }
}
await chrome.kill();
await writeFile(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
