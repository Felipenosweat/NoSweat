import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
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

export async function generateMetadata({ params }: ExamplePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isFixtureSlug(slug)) return {};
  return {
    title: `Example: ${fixtures[slug].business.name}`,
    robots: { index: false },
  };
}

export default async function ExamplePage({ params, searchParams }: ExamplePageProps) {
  const { slug } = await params;
  if (!isFixtureSlug(slug)) notFound();
  const spec = fixtures[slug];
  const embed = (await searchParams).embed === "1";

  return (
    <>
      {!embed && (
        // Uma linha só; fixa no topo apenas do sm para cima (no celular rola junto).
        <div className="top-0 z-50 flex min-h-11 items-center justify-center bg-ink px-3 text-center text-[13px] whitespace-nowrap text-slate-300 sm:sticky sm:px-4 sm:text-sm">
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
        </div>
      )}
      {/* Sem contactEndpoint: o formulário de exemplo fica desligado. */}
      <SiteRenderer spec={spec} />
    </>
  );
}
