import { fixtures, MODEL_LIBRARY, type FixtureSlug } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import type { Metadata } from "next";

// Os sites de exemplo (fictícios) de /examples/<slug> e /examples/<slug>/embed. As duas páginas
// são estáticas: todos os endereços saem no build (generateStaticParams) e o resto é 404.

const isFixtureSlug = (slug: string): slug is FixtureSlug => slug in fixtures;

/** Os 6 sites de exemplo originais e os da biblioteca de modelos (todos fictícios). */
export function exampleSpec(slug: string): SiteSpec | null {
  if (isFixtureSlug(slug)) return fixtures[slug];
  return MODEL_LIBRARY.find((entry) => entry.slug === slug)?.spec ?? null;
}

/** Todos os endereços de exemplo, sem repetir. */
export function exampleParams(): { slug: string }[] {
  const slugs = new Set<string>([
    ...Object.keys(fixtures),
    ...MODEL_LIBRARY.map((entry) => entry.slug),
  ]);
  return [...slugs].map((slug) => ({ slug }));
}

export function exampleMetadata(slug: string): Metadata {
  const spec = exampleSpec(slug);
  if (!spec) return {};
  return {
    title: `Example: ${spec.business.name}`,
    robots: { index: false },
  };
}
