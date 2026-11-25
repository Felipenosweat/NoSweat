import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exampleMetadata, exampleParams, exampleSpec } from "./example-spec";
import { FREEFORM_EXAMPLES, freeformExample, freeformExampleFile } from "@/lib/freeform-examples";

// Site de exemplo (fixture) para a landing page: nosweatfd.com/examples/<slug>.
// Totalmente estático. Sem a faixa de aviso (molduras de navegador/celular da landing):
// /examples/<slug>/embed. Os exemplos "código livre" (lib/freeform-examples.ts) abrem num iframe isolado.

type ExamplePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return [...exampleParams(), ...FREEFORM_EXAMPLES.map(({ slug }) => ({ slug }))];
}

export async function generateMetadata({ params }: ExamplePageProps): Promise<Metadata> {
  const { slug } = await params;
  const freeform = freeformExample(slug);
  if (freeform) return { title: `Example: ${freeform.name}`, robots: { index: false } };
  return exampleMetadata(slug);
}

export default async function ExamplePage({ params }: ExamplePageProps) {
  const { slug } = await params;
  const freeform = freeformExample(slug);
  const spec = freeform ? null : exampleSpec(slug);
  if (!freeform && !spec) notFound();

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
      {freeform ? (
        // Origem opaca: sem allow-same-origin (o código não toca na nosweatfd.com) e sem
        // allow-forms (o formulário de exemplo não envia). tel:/mailto: ainda abrem o app.
        <iframe
          src={freeformExampleFile(freeform.slug)}
          title={`${freeform.name}, fictional example site`}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-to-custom-protocols"
          referrerPolicy="no-referrer"
          className="fixed inset-0 h-dvh w-full border-0"
        />
      ) : (
        // Sem contactEndpoint: o formulário de exemplo fica desligado. bookingDemo: o agendamento
        // mostra horários de exemplo (só nos exemplos; nunca em site de cliente).
        spec && <SiteRenderer spec={spec} bookingDemo />
      )}
    </>
  );
}
