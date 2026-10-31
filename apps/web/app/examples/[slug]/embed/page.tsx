import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exampleMetadata, exampleParams, exampleSpec } from "../example-spec";

// Site de exemplo sem a faixa de aviso, para as molduras de navegador/celular da landing (e as
// capturas do renderer): nosweatfd.com/examples/<slug>/embed. Totalmente estático, como
// /examples/<slug>. (Antes era /examples/<slug>?embed=1, que deixava a página dinâmica.)

type ExampleEmbedPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return exampleParams();
}

export async function generateMetadata({ params }: ExampleEmbedPageProps): Promise<Metadata> {
  return exampleMetadata((await params).slug);
}

export default async function ExampleEmbedPage({ params }: ExampleEmbedPageProps) {
  const spec = exampleSpec((await params).slug);
  if (!spec) notFound();
  // Sem contactEndpoint: o formulário de exemplo fica desligado.
  return <SiteRenderer spec={spec} />;
}
