// Endereço grátis do site (/s/<slug>). Função pura: o servidor (publicar) e o editor (mostrar
// o endereço antes da primeira publicação) usam a mesma regra.

/** "Joe's Plumbing" + id → "joes-plumbing-6f1c2a" (único por causa do pedaço do id). */
export function makeSlug(name: string, id: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "site";
  return `${base}-${id.replace(/-/g, "").slice(0, 6).toLowerCase()}`;
}
