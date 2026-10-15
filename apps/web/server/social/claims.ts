// Trava da regra 8 (CLAUDE.md): nada de afirmação inventada. Avaliações, estrelas, prêmios,
// licenças, garantias, "same-day", anos de experiência, descontos e preços só podem aparecer
// se vierem do dono (`business.highlights`). Aqui é só um alerta por palavras-chave: o post fica
// marcado (`claimsFlagged`) e o dono vê um aviso antes de aprovar.

/** Cada regra é um tipo de afirmação; a mesma regra é testada no texto e nos highlights. */
const CLAIM_PATTERNS: RegExp[] = [
  // Avaliações e notas
  /\b(reviews?|testimonials?)\b/i,
  /\b(\d(\.\d)?|five|four)[- ]?stars?\b/i,
  /\b(top[- ]rated|highly[- ]rated|rated)\b/i,
  // "O melhor" / número 1
  /(^|[^\w])#\s?1(?!\d)/i,
  /\b(number one|no\.\s?1)\b/i,
  /\bbest in (town|the (city|area|state|region|county|valley|bay))\b/i,
  /\bbest[- ]rated\b/i,
  // Prêmios e credenciais
  /\baward(s|ed|[- ]winning)?\b/i,
  /\b(licen[sc]ed|insured|bonded|certified|accredited)\b/i,
  // Garantias e prazos
  /\b(guarantee[ds]?|warrant(y|ies))\b/i,
  /\bsame[- ]day\b/i,
  /\b24\s?\/\s?7\b/i,
  // Experiência
  /\byears? of experience\b/i,
  /\b\d+\+?\s*(years?|yrs?)\b/i,
  /\bsince (19|20)\d{2}\b/i,
  // Preços, descontos e ofertas
  /\bdiscounts?\b/i,
  /\d\s?%/,
  /\$/,
  /\b(prices?|pricing)\b/i,
  /\bfree (estimates?|quotes?|consultations?|inspections?|delivery|shipping)\b/i,
  /\b(coupons?|promo(tion)?s?|promo codes?|special offers?)\b/i,
];

/**
 * `true` se o texto tem alguma afirmação que precisa vir do dono e que NÃO está nos highlights.
 * Ex.: "same-day service" passa só se algum highlight também fala em "same-day".
 */
export function hasUnverifiedClaims(text: string, highlights: string[]): boolean {
  const confirmed = highlights.join(" | ");
  return CLAIM_PATTERNS.some((pattern) => pattern.test(text) && !pattern.test(confirmed));
}
