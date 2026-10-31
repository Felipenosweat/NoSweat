import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exampleMetadata, exampleParams, exampleSpec } from "./example-spec";

// Site de exemplo (fixture) para a landing page: nosweatfd.com/examples/<slug>.
// Totalmente estático. Sem a faixa de aviso (molduras de navegador/celular da landing):
// /examples/<slug>/embed.

type ExamplePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return exampleParams();
}

export async function generateMetadata({ params }: ExamplePageProps): Promise<Metadata> {
  return exampleMetadata((await params).slug);
}

export default async function ExamplePage({ params }: ExamplePageProps) {
  const { slug } = await params;
  const spec = exampleSpec(slug);
  if (!spec) notFound();

  return (
    <>
      {/* Etiqueta flutuante no canto de baixo (o menu do site fica livre no alto). No celular,
          logo acima da barra de ligar do site. */}
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
      {/* Sem contactEndpoint: o formulário de exemplo fica desligado. */}
      <SiteRenderer spec={spec} />
    </>
  );
}
