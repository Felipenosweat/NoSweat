import { landingName } from "@/app/(dashboard)/create/brief";

// Lógica pura das perguntas do topo da landing (HeroStepper), sem React, para testar no Vitest.
// O nome do negócio NÃO entra no texto: vai à parte (`?name=`), porque é um fato do dono. O
// /create põe o nome no campo "Business name", e ele chega ao servidor como `businessName`
// (ver generateRequest). Antes ele ia no começo do texto ("Joe's Plumbing. Home services
// business in Austin, TX.") e o servidor não reconhecia o nome (bug J1 da auditoria).

export const KINDS = [
  { label: "Home services", phrase: "Home services business" },
  { label: "Food & drink", phrase: "Restaurant or food business" },
  { label: "Beauty & wellness", phrase: "Beauty and wellness business" },
  { label: "Health & fitness", phrase: "Health and fitness business" },
  { label: "Professional services", phrase: "Professional services firm" },
  { label: "Shop & retail", phrase: "Local shop" },
  { label: "Something else", phrase: "Local business" },
] as const;

export type HeroAnswers = { kind: string; where: string; name: string; details: string };

/** O texto (sem o nome) e o nome que a landing manda para o /create. */
export function heroBrief(answers: HeroAnswers): { brief: string; name: string } {
  const phrase = KINDS.find((k) => k.label === answers.kind)?.phrase ?? "Local business";
  const brief = [`${phrase} in ${answers.where.trim()}.`, answers.details.trim()]
    .filter(Boolean)
    .join(" ");
  return { brief, name: landingName(answers.name) };
}

/** /create?brief=…&name=…&start=1 (o nome só quando foi digitado). */
export function heroCreateUrl(answers: HeroAnswers): string {
  const { brief, name } = heroBrief(answers);
  const params = new URLSearchParams({ brief });
  if (name) params.set("name", name);
  params.set("start", "1");
  return `/create?${params.toString()}`;
}
