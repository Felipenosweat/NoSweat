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
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2.5 text-center text-sm text-slate-300">
          <span>
            Example site made with No Sweat. {spec.business.name} is a fictional business.
          </span>
          <Link
            href="/create"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            Build yours free &rarr;
          </Link>
        </div>
      )}
      {/* Sem contactEndpoint: o formulário de exemplo fica desligado. */}
      <SiteRenderer spec={spec} />
    </>
  );
}
