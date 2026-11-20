import { SiteSpec } from "@nosweat/schema";

// Nome do negócio digitado pelo dono (landing, pergunta 3, ou o campo "Business name" do
// /create). É um fato do dono: vale sobre o que o gerador escolheu (o mock, o modo modelo e a IA
// podem ler mal o pedido ou sugerir outro nome). O texto vai como está: o React escapa na hora
// de desenhar, então "<b>Glow</b>" aparece como texto, nunca como HTML.

/** Limpa o nome digitado: espaços repetidos viram um, sem caracteres de controle. */
export function cleanOwnerName(name: string | null | undefined): string | undefined {
  const clean = (name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean ? clean.slice(0, 80) : undefined;
}

/** Troca, em todos os textos, o nome que o gerador inventou pelo nome do dono. */
function replaceEverywhere(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((item) => replaceEverywhere(item, from, to));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        replaceEverywhere(item, from, to),
      ]),
    );
  }
  return value;
}

/**
 * Põe o nome do dono no site. `business.name` sempre; nos outros textos, troca o nome que o
 * gerador tinha escolhido (ex.: "Welcome to Austin Home Services") só se o resultado continuar
 * válido (limites de tamanho do schema). Nome curto demais (menos de 4 letras) não é trocado nos
 * textos, para não mexer em palavras comuns.
 */
export function withOwnerName(spec: SiteSpec, ownerName: string | null | undefined): SiteSpec {
  const name = cleanOwnerName(ownerName);
  if (!name || spec.business.name === name) return spec;
  const previous = spec.business.name.trim();
  const named = SiteSpec.parse({ ...spec, business: { ...spec.business, name } });
  if (previous.length < 4 || name.includes(previous)) return named;
  const replaced = SiteSpec.safeParse(replaceEverywhere(named, previous, name));
  return replaced.success ? replaced.data : named;
}
