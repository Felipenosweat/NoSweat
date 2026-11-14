// EXPERIMENTO "caminho A": gera 6 landing pages em código livre (HTML) com o Claude e salva em
// apps/web/.freeform-samples/ (fora do Git). Não toca em banco, rotas nem na geração de produção.
//
// Uso (de dentro de apps/web; o Node 22 roda TypeScript direto, sem dependência nova):
//   ANTHROPIC_API_KEY=... node scripts/freeform-batch.mts              # os 6 pedidos
//   ANTHROPIC_API_KEY=... node scripts/freeform-batch.mts bbq bakery   # só alguns (pelo slug)
// Variáveis: FREEFORM_MODEL (claude-sonnet-5-5 padrão | claude-opus-5-5), FREEFORM_EFFORT
// (low..max, opcional), FREEFORM_FALLBACKS=off (desliga o substituto do servidor).
// Depois: /lab/freeform no `pnpm dev` ou `node scripts/freeform-sheet.mjs` para a folha de prints.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freeformModelFromEnv, generateFreeformSite } from "../server/freeform/generate.ts";
import { estimateFreeformCostUsd } from "../server/freeform/pricing.ts";
import type { FreeformBrief } from "../server/freeform/prompt.ts";
import { sanitizeFreeformHtml } from "../server/freeform/sanitize.ts";

type Sample = { slug: string; brief: FreeformBrief };

// Negócios fictícios. Alguns pedidos não dão telefone ou horário de propósito: o site tem de usar
// [Your phone] e omitir o horário em vez de inventar (regra 8).
const SAMPLES: Sample[] = [
  {
    slug: "barber-old-school",
    brief: {
      description:
        "Sal's Barber Shop on Federal Hill in Providence, RI. I'm Sal Russo, I've been cutting hair in this same chair since my dad handed me the shop. Old school: hot towel shaves, straight razor, flat tops, regular cuts for guys and kids. Walk-ins only, cash or card. Open Tuesday to Saturday 8 AM to 5 PM. Phone (401) 555-0143. Sports radio on, no appointments, no fuss.",
    },
  },
  {
    slug: "barber-studio",
    brief: {
      description:
        "Fade Theory is a modern barber studio in East Austin run by Dani Okafor. We do skin fades, tapers, textured crops, beard sculpting and hair designs. Appointments only, booked online. Music loud, clean minimal space, lots of creative clients from the neighborhood. Email hello@fadetheory.example.",
    },
  },
  {
    slug: "family-law",
    brief: {
      description:
        "Marisol Vega Law, family law attorney in Tucson, Arizona. I handle divorce, child custody, parenting plans, child support and adoptions. I speak English and Spanish. Free 20-minute phone consultation for new clients. Office near downtown Tucson, Monday to Friday 9 AM to 5 PM. Phone (520) 555-0187. I want people who are scared and stressed to feel like they can call me.",
    },
  },
  {
    slug: "bbq",
    brief: {
      description:
        "Brisket & Ember, a BBQ joint in Lockhart, Texas. Post oak smoked brisket, pork ribs, jalapeno cheddar sausage, sold by the pound until we sell out. Sides are beans, slaw and potato salad. We also cater parties of 20 or more. Open Thursday to Sunday from 11 AM until sold out. Owners are the Delgado brothers, Ray and Tomas.",
    },
  },
  {
    slug: "landscaping",
    brief: {
      description:
        "Greenway Landscaping does lawn mowing, spring and fall cleanups, mulch, shrub trimming, and small patio and retaining wall installs for homes in Overland Park, Olathe and Leawood, Kansas. Family business run by Mike and Jen Patterson. Free estimates. Call or text (913) 555-0122.",
    },
  },
  {
    slug: "bakery",
    brief: {
      description:
        "Little Crumb Bakery in Burlington, Vermont. Sourdough loaves, morning buns, maple scones, seasonal fruit galettes and custom birthday cakes with a week's notice. Everything is baked in the morning in our small shop on Pine Street. I'm Hannah, I bake, my partner Luis runs the counter. Open Wednesday to Sunday 7 AM to 2 PM.",
    },
  },
];

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", ".freeform-samples");

if (!process.env.ANTHROPIC_API_KEY?.trim()) {
  console.error(
    "ANTHROPIC_API_KEY is not set. This script calls the Anthropic API (it costs money) and " +
      "cannot run without a key. Run it as:\n  ANTHROPIC_API_KEY=sk-ant-... node scripts/freeform-batch.mts",
  );
  process.exit(1);
}

const model = freeformModelFromEnv();
const only = process.argv.slice(2);
const selected = only.length > 0 ? SAMPLES.filter((sample) => only.includes(sample.slug)) : SAMPLES;
if (selected.length === 0) {
  console.error(
    `No sample matches ${only.join(", ")}. Slugs: ${SAMPLES.map((s) => s.slug).join(", ")}`,
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
console.log(`Generating ${selected.length} site(s) with ${model} → ${outDir}\n`);

let totalUsd = 0;
let failures = 0;
// Em sequência: o pedido do sistema fica no cache e o lote não estoura o limite de taxa.
for (const sample of selected) {
  const started = Date.now();
  try {
    const result = await generateFreeformSite(sample.brief, { model });
    const imageUrls = (sample.brief.photos ?? []).map((photo) => photo.url);
    const sanitized = sanitizeFreeformHtml(result.html, { imageUrls });
    const usd = estimateFreeformCostUsd(result.model, result.usage);
    if (usd !== null) totalUsd += usd;

    writeFileSync(path.join(outDir, `${sample.slug}.html`), sanitized.html);
    writeFileSync(
      path.join(outDir, `${sample.slug}.json`),
      JSON.stringify(
        {
          slug: sample.slug,
          requestedModel: model,
          model: result.model,
          generatedAt: new Date().toISOString(),
          seconds: Math.round((Date.now() - started) / 1000),
          usage: result.usage,
          estimatedUsd: usd,
          bytes: Buffer.byteLength(sanitized.html),
          removedBySanitizer: sanitized.removed,
          brief: sample.brief,
        },
        null,
        2,
      ),
    );

    const u = result.usage;
    console.log(
      [
        sample.slug.padEnd(18),
        result.model.padEnd(18),
        `in ${u.input_tokens}`,
        `cache w/r ${u.cache_creation_input_tokens ?? 0}/${u.cache_read_input_tokens ?? 0}`,
        `out ${u.output_tokens}`,
        usd === null ? "cost ?" : `~$${usd.toFixed(3)}`,
        `${Math.round((Date.now() - started) / 1000)}s`,
        sanitized.removed.length > 0 ? `sanitized: ${sanitized.removed.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("  "),
    );
  } catch (error) {
    failures++;
    console.error(`${sample.slug.padEnd(18)} FAILED: ${(error as Error).message}`);
  }
}

console.log(
  `\nEstimated total: ~$${totalUsd.toFixed(3)} (prices in server/freeform/pricing.ts; ` +
    "not the invoice). Failures: " +
    failures,
);
process.exit(failures > 0 ? 1 : 0);
