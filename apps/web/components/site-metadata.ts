import type { Metadata } from "next";
import type { SiteRecord } from "@/server/store";

/** Título e descrição de um site publicado (usado em /s/<slug> e no domínio do cliente). */
export function siteMetadata(site: SiteRecord): Metadata {
  const { business, sections } = site.spec;
  const hero = sections.find((s) => s.type === "hero");
  const where = [business.city, business.state].filter(Boolean).join(", ");
  return {
    // `absolute` para não herdar o " · No Sweat" do layout: o site é do cliente.
    title: { absolute: where ? `${business.name} | ${where}` : business.name },
    description: hero?.type === "hero" ? hero.subtitle : undefined,
  };
}
