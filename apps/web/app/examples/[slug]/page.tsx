import { fixtures, MODEL_LIBRARY, type FixtureSlug } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// Site de exemplo (fixture) para a landing page: nosweatfd.com/examples/<slug>.
// Com ?embed=1 some a faixa de aviso (usado nas molduras de navegador/celular da landing).

type ExamplePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
};

const isFixtureSlug = (slug: string): slug is FixtureSlug => slug in fixtures;

/** Os 6 sites de exemplo originais e os da biblioteca de modelos (todos fictícios). */
function exampleSpec(slug: string): SiteSpec | null {
  if (isFixtureSlug(slug)) return fixtures[slug];
  return MODEL_LIBRARY.find((entry) => entry.slug === slug)?.spec ?? null;
}

export async function generateMetadata({ params }: ExamplePageProps): Promise<Metadata> {
  const { slug } = await params;
  const spec = exampleSpec(slug);
  if (!spec) return {};
  return {
    title: `Example: ${spec.business.name}`,
    robots: { index: false },
  };
}

export default async function ExamplePage({ params, searchParams }: ExamplePageProps) {
  const { slug } = await params;
  const spec = exampleSpec(slug);
  if (!spec) notFound();
  const embed = (await searchParams).embed === "1";

  return (
    <>
      {!embed && (
        // Etiqueta flutuante no canto de baixo (o menu do site fica livre no alto). No celular,
        // logo acima da barra de ligar do site.
        <aside
          aria-label="About this example"
          className="fixed bottom-24 left-1/2 z-50 flex min-h-11 -translate-x-1/2 items-center rounded-full bg-ink/90 px-4 text-center text-[13px] whitespace-nowrap text-slate-300 shadow-lg backdrop-blur md:bottom-5 md:left-5 md:translate-x-0 md:text-sm"
        >
          <p>
            Fictional example made with No Sweat
            <span aria-hidden="true" className="px-1.5 text-slate-400">
              &middot;
            </span>
            <Link
              href="/create"
              className="inline-flex min-h-11 items-center rounded-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Build my website&nbsp;<span aria-hidden="true">&rarr;</span>
            </Link>
          </p>
        </aside>
      )}
      {/* Sem contactEndpoint: o formulário de exemplo fica desligado. */}
      <SiteRenderer spec={spec} />
    </>
  );
}
