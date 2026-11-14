// EXPERIMENTO "caminho A": gera 6 landing pages em código livre (HTML) com o Claude e salva em
// apps/web/.freeform-samples/ (fora do Git). Não toca em banco, rotas nem na geração de produção.
//
// Uso (de dentro de apps/web; o Node 22 roda TypeScript direto, sem dependência nova):
//   ANTHROPIC_API_KEY=... node scripts/freeform-batch.mts              # os 6 pedidos
//   ANTHROPIC_API_KEY=... node scripts/freeform-batch.mts bbq bakery   # só alguns (pelo slug)
// Variáveis: FREEFORM_MODEL (claude-sonnet-5-5 padrão | claude-opus-5-5), FREEFORM_EFFORT
// (low..max, opcional), FREEFORM_FALLBACKS=off (desliga o substituto do servidor),
// FREEFORM_PHOTOS=off (sem fotos do Unsplash), FREEFORM_REVISE=off (sem a segunda passada).
//
// v2 ("nível awwwards"): 1) busca fotos no Unsplash e a IA VÊ cada uma; 2) a IA escreve a página
// (pode usar GSAP/ScrollTrigger/SplitText/Lenis, ver server/freeform/assets.ts); 3) a página é
// aberta no sandbox, vira prints (desktop e celular) e a IA critica e reescreve (segunda passada).
// O rascunho da primeira passada fica em .freeform-samples/_drafts/.
// Depois: /lab/freeform no `pnpm dev` ou `node scripts/freeform-sheet.mjs` para a folha de prints.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FREEFORM_LINK_HOSTS, FREEFORM_SCRIPT_URLS } from "../server/freeform/assets.ts";
import {
  freeformModelFromEnv,
  generateFreeformSite,
  reviseFreeformSite,
  type FreeformResult,
} from "../server/freeform/generate.ts";
import { findFreeformPhotos, pingUsedPhotos } from "../server/freeform/photos.ts";
import { estimateFreeformCostUsd } from "../server/freeform/pricing.ts";
import { FREEFORM_DIRECTIONS, type FreeformBrief } from "../server/freeform/prompt.ts";
import { sanitizeFreeformHtml } from "../server/freeform/sanitize.ts";
// @ts-expect-error: módulo .mjs sem tipos (só roda no Node, fora do typecheck do app).
import { launchBrowser, renderShots } from "./freeform-render.mjs";

/** `photoQueries`: termos concretos para o Unsplash (no produto, viriam da IA ou do dono). */
type Sample = { slug: string; brief: FreeformBrief; photoQueries: string[] };

// Negócios fictícios. Alguns pedidos não dão telefone ou horário de propósito: o site tem de usar
// [Your phone] e omitir o horário em vez de inventar (regra 8).
const SAMPLES: Sample[] = [
  {
    slug: "barber-old-school",
    photoQueries: ["old barbershop chair", "straight razor shave", "barber hot towel shave", "barber pole"],
    brief: {
      description:
        "Sal's Barber Shop on Federal Hill in Providence, RI. I'm Sal Russo, I've been cutting hair in this same chair since my dad handed me the shop. Old school: hot towel shaves, straight razor, flat tops, regular cuts for guys and kids. Walk-ins only, cash or card. Open Tuesday to Saturday 8 AM to 5 PM. Phone (401) 555-0143. Sports radio on, no appointments, no fuss.",
    },
  },
  {
    slug: "barber-studio",
    photoQueries: ["skin fade haircut", "modern barbershop interior", "barber clippers", "hair design barber"],
    brief: {
      description:
        "Fade Theory is a modern barber studio in East Austin run by Dani Okafor. We do skin fades, tapers, textured crops, beard sculpting and hair designs. Appointments only, booked online. Music loud, clean minimal space, lots of creative clients from the neighborhood. Email hello@fadetheory.example.",
    },
  },
  {
    slug: "family-law",
    photoQueries: ["saguaro desert dusk", "Tucson mountains", "parent child holding hands", "law books desk light"],
    brief: {
      description:
        "Marisol Vega Law, family law attorney in Tucson, Arizona. I handle divorce, child custody, parenting plans, child support and adoptions. I speak English and Spanish. Free 20-minute phone consultation for new clients. Office near downtown Tucson, Monday to Friday 9 AM to 5 PM. Phone (520) 555-0187. I want people who are scared and stressed to feel like they can call me.",
    },
  },
  {
    slug: "bbq",
    photoQueries: ["smoked brisket sliced", "barbecue smoker smoke", "texas barbecue butcher paper", "firewood oak stack"],
    brief: {
      description:
        "Brisket & Ember, a BBQ joint in Lockhart, Texas. Post oak smoked brisket, pork ribs, jalapeno cheddar sausage, sold by the pound until we sell out. Sides are beans, slaw and potato salad. We also cater parties of 20 or more. Open Thursday to Sunday from 11 AM until sold out. Owners are the Delgado brothers, Ray and Tomas.",
    },
  },
  {
    slug: "landscaping",
    photoQueries: ["freshly mowed lawn stripes", "mulch garden bed", "stone retaining wall garden", "trimmed shrubs house"],
    brief: {
      description:
        "Greenway Landscaping does lawn mowing, spring and fall cleanups, mulch, shrub trimming, and small patio and retaining wall installs for homes in Overland Park, Olathe and Leawood, Kansas. Family business run by Mike and Jen Patterson. Free estimates. Call or text (913) 555-0122.",
    },
  },
  {
    slug: "bakery",
    photoQueries: ["sourdough bread crumb", "morning bun pastry", "bakery counter morning light", "fruit galette"],
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

const usePhotos = process.env.FREEFORM_PHOTOS?.trim() !== "off";
const revise = process.env.FREEFORM_REVISE?.trim() !== "off";
const draftsDir = path.join(outDir, "_drafts");
mkdirSync(draftsDir, { recursive: true });
console.log(
  `Generating ${selected.length} site(s) with ${model} → ${outDir}` +
    ` (photos ${usePhotos ? "on" : "off"}, revision ${revise ? "on" : "off"})\n`,
);

const browser = revise ? await launchBrowser() : null;
let totalUsd = 0;
let failures = 0;

const costOf = (result: FreeformResult) => estimateFreeformCostUsd(result.model, result.usage);
const usageLine = (result: FreeformResult) => {
  const u = result.usage;
  const usd = costOf(result);
  return `in ${u.input_tokens} cache r ${u.cache_read_input_tokens ?? 0} out ${u.output_tokens} ${usd === null ? "?" : `~$${usd.toFixed(3)}`}`;
};

// Uma família de direção de arte diferente para cada site do lote (sorteio sem repetir).
const directions = [...FREEFORM_DIRECTIONS].sort(() => Math.random() - 0.5);

// Em sequência: o pedido do sistema fica no cache e o lote não estoura o limite de taxa.
for (const [index, sample] of selected.entries()) {
  const started = Date.now();
  try {
    const photos = usePhotos ? await findFreeformPhotos(sample.photoQueries) : [];
    const direction = directions[index % directions.length];
    const brief: FreeformBrief = { ...sample.brief, photos, direction };
    const clean = (html: string) =>
      sanitizeFreeformHtml(html, {
        imageUrls: photos.map((photo) => photo.url),
        scriptUrls: FREEFORM_SCRIPT_URLS,
        linkHosts: FREEFORM_LINK_HOSTS,
      });

    const draft = await generateFreeformSite(brief, { model });
    const draftClean = clean(draft.html);
    writeFileSync(path.join(draftsDir, `${sample.slug}.html`), draftClean.html);
    let final = draft;
    let finalClean = draftClean;
    let problems: string[] = [];
    if (browser) {
      const rendered = await renderShots(browser, draftClean.html);
      problems = rendered.problems;
      final = await reviseFreeformSite(
        brief,
        { html: draft.html, screenshots: rendered.screenshots, problems },
        { model },
      );
      finalClean = clean(final.html);
    }
    const usedPhotos = await pingUsedPhotos(finalClean.html, photos);

    const passes = final === draft ? [draft] : [draft, final];
    const usd = passes.reduce((sum, pass) => sum + (costOf(pass) ?? 0), 0);
    totalUsd += usd;
    const seconds = Math.round((Date.now() - started) / 1000);

    writeFileSync(path.join(outDir, `${sample.slug}.html`), finalClean.html);
    writeFileSync(
      path.join(outDir, `${sample.slug}.json`),
      JSON.stringify(
        {
          slug: sample.slug,
          requestedModel: model,
          model: final.model,
          generatedAt: new Date().toISOString(),
          seconds,
          passes: passes.map((pass) => ({ usage: pass.usage, estimatedUsd: costOf(pass) })),
          estimatedUsd: usd,
          bytes: Buffer.byteLength(finalClean.html),
          problemsAfterDraft: problems,
          removedBySanitizer: finalClean.removed,
          photos: { offered: photos.length, used: usedPhotos },
          brief,
        },
        null,
        2,
      ),
    );

    console.log(
      [
        sample.slug.padEnd(18),
        `[${direction?.split(":")[0]}]`,
        `photos ${usedPhotos}/${photos.length}`,
        `draft: ${usageLine(draft)}`,
        final === draft ? "" : `revision: ${usageLine(final)}`,
        `total ~$${usd.toFixed(3)}`,
        `${seconds}s`,
        problems.length > 0 ? `draft problems: ${problems.join(" | ")}` : "",
        finalClean.removed.length > 0 ? `sanitized: ${finalClean.removed.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("  "),
    );
  } catch (error) {
    failures++;
    console.error(`${sample.slug.padEnd(18)} FAILED: ${(error as Error).message}`);
  }
}
await browser?.close();

console.log(
  `\nEstimated total: ~$${totalUsd.toFixed(3)} (prices in server/freeform/pricing.ts; ` +
    "not the invoice). Failures: " +
    failures,
);
process.exit(failures > 0 ? 1 : 0);
