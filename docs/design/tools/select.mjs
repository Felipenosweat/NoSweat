#!/usr/bin/env node
// Seletor de direção de arte (para quem desenha à mão: Claude Code e pessoas).
// Lê o pedido (ramo, tons, objetivo), escolhe o arquétipo e as referências que combinam e
// monta uma combinação dos "eixos de design" (composição, tipografia, hierarquia, imagem,
// navegação, movimento, superfície) EVITANDO o que os últimos projetos já usaram
// (docs/design/usage-log.json). É assim que a variedade fica estrutural: dois projetos
// parecidos não saem com a mesma combinação de eixos.
//
// Uso:
//   node docs/design/tools/select.mjs --industry hotel --tones refined,premium --goal book
//   node docs/design/tools/select.mjs ... --record "Aurelia Royal Estate"   (grava no log)
// Sem dependências; o resultado é JSON (cole no brief do projeto).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(join(DIR, file), "utf8"));

function args() {
  const out = { industry: "", tones: [], goal: "", record: "" };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    const value = argv[i + 1] ?? "";
    if (key === "tones") out.tones = value.split(",").filter(Boolean);
    else if (key in out) out[key] = value;
  }
  return out;
}

/** Quanto uma referência combina com o pedido (ramo vale mais que tom; objetivo desempata). */
function scoreReference(ref, brief) {
  const fits = ref.fits ?? {};
  let score = 0;
  if ((fits.businesses ?? []).includes(brief.industry)) score += 3;
  score += (fits.tones ?? []).filter((tone) => brief.tones.includes(tone)).length;
  if ((fits.goals ?? []).includes(brief.goal)) score += 1;
  if (ref.evidenceStatus === "verified-live") score += 0.5;
  return score;
}

/** Penalidade por repetição: o mesmo valor num eixo pesa mais quanto mais recente o uso. */
function recencyPenalty(log, axis, value) {
  let penalty = 0;
  log.slice(-6).forEach((entry, index, list) => {
    const age = list.length - index; // 1 = o último projeto
    if (entry.axes?.[axis] === value) penalty += 2 / age;
  });
  return penalty;
}

const brief = args();
const references = read("references.json");
const { archetypes, axes } = read("archetypes.json");
let log = [];
try {
  log = read("usage-log.json");
} catch {
  log = [];
}

const rankedRefs = references
  .filter((ref) => ref.evidenceStatus !== "unavailable")
  .map((ref) => ({ ref, score: scoreReference(ref, brief) }))
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

// Arquétipo: o que mais aparece entre as melhores referências, ajustado pelo ajuste direto do
// arquétipo ao pedido e pela repetição recente.
const archetypeScores = archetypes.map((archetype) => {
  let score = 0;
  if (archetype.fits.businesses.includes(brief.industry)) score += 3;
  // O tom pesa mais no arquétipo que na referência: é o que separa um spa acolhedor de um palácio.
  score += archetype.fits.tones.filter((tone) => brief.tones.includes(tone)).length * 1.5;
  // Referência do mesmo ramo puxa forte; a que só combina no tom puxa pouco.
  for (const item of rankedRefs) {
    if (item.ref.archetype !== archetype.id) continue;
    score += (item.ref.fits?.businesses ?? []).includes(brief.industry) ? 1.5 : 0.5;
  }
  score -= recencyPenalty(log, "archetype", archetype.id) * 1.5;
  return { archetype, score };
});
archetypeScores.sort((a, b) => b.score - a.score);
const chosen = archetypeScores[0]?.archetype;

// Para cada eixo: as opções que o arquétipo prefere, menos o que foi usado há pouco.
const combination = { archetype: chosen?.id };
for (const axis of Object.keys(axes)) {
  const preferred = chosen?.axes?.[axis] ?? [];
  const options = axes[axis].map((option) => {
    const rank = preferred.indexOf(option.id);
    const base = rank === -1 ? 0 : preferred.length - rank;
    return { id: option.id, score: base - recencyPenalty(log, axis, option.id) };
  });
  options.sort((a, b) => b.score - a.score);
  combination[axis] = options[0]?.id;
}

const result = {
  brief,
  archetype: chosen
    ? { id: chosen.id, name: chosen.name, summary: chosen.summary, avoid: chosen.avoid }
    : null,
  alternatives: archetypeScores.slice(1, 3).map((item) => item.archetype.id),
  axes: combination,
  references: rankedRefs.map(({ ref, score }) => ({
    id: ref.id,
    score,
    study: ref.study ?? null,
    principles: (ref.principles ?? []).slice(0, 3),
  })),
  recentlyUsed: log.slice(-3).map((entry) => `${entry.project}: ${entry.axes?.archetype}`),
};

if (brief.record) {
  log.push({
    project: brief.record,
    date: new Date().toISOString().slice(0, 10),
    axes: combination,
  });
  writeFileSync(join(DIR, "usage-log.json"), `${JSON.stringify(log, null, 2)}\n`);
  result.recorded = brief.record;
}

console.log(JSON.stringify(result, null, 2));
