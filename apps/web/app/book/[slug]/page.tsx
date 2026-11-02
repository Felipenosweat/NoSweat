import { BookingSection, siteStyle, themeToCssVars } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteUnavailable } from "@/components/SiteUnavailable";
import { phoneHref } from "@/lib/clients";
import { getPublicSiteBySlug } from "@/server/store/public-site";

// Página de marcação para compartilhar (nosweatfd.com/book/<slug>): o mesmo seletor da seção
// "Booking" do site, sozinho numa página com as cores do site publicado. Pública e sem login;
// não é indexada (o endereço oficial do negócio é o site). Mesmo cache dos sites (ISR).

export const revalidate = 3600;

/** Nenhum endereço no build: todos são gerados na primeira visita. */
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type BookPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSiteBySlug(slug);
  return {
    title: site ? `Book · ${site.spec.business.name}` : "Book online",
    robots: { index: false, follow: false },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const site = await getPublicSiteBySlug(slug);
  if (!site) notFound();
  const { spec } = site;
  if (!site.liveAccess) return <SiteUnavailable name={spec.business.name} />;

  const { business } = spec;
  const style = siteStyle(spec);
  const phone = business.phone?.trim() || undefined;
  const telHref = phone ? `tel:${phoneHref(phone)}` : undefined;
  // Quem escolheu a seção já deu título e frase; sem ela, os padrões abaixo.
  const section = spec.sections.find((item) => item.type === "booking");
  const intro =
    section?.type === "booking" ? section.intro : "Pick a service and a time that works for you.";

  return (
    <div
      className="ns-site @container min-h-screen bg-ns-background font-ns-body text-ns-text antialiased"
      style={themeToCssVars(spec.theme)}
      data-font={spec.theme.font}
      data-buttons={style.buttons}
      data-template={spec.template}
    >
      <main
        id="main"
        className="mx-auto w-full max-w-2xl px-5 py-10 @min-[40rem]:px-8 @min-[40rem]:py-16"
      >
        <BookingSection
          endpoint={`/api/public/booking/${site.id}`}
          layout="stack"
          intro={intro}
          phone={phone}
          phoneHref={telHref}
          heading={
            <>
              <p className="text-[0.6875rem] tracking-[0.22em] text-ns-muted uppercase">
                {business.name}
              </p>
              <h1 className="mt-3 font-ns-heading text-[length:clamp(2.25rem,8cqw,3.5rem)] leading-[1] font-ns-display tracking-[-0.03em]">
                Book online
              </h1>
            </>
          }
          fallback={
            <div className="rounded-xl border border-ns-border p-6">
              <h1 className="font-ns-heading text-3xl">{business.name}</h1>
              <p className="mt-3 text-ns-muted">
                Online booking isn&rsquo;t available right now.
                {phone && telHref ? (
                  <>
                    {" "}
                    Please call{" "}
                    <a href={telHref} className="font-semibold text-ns-text underline">
                      {phone}
                    </a>
                    .
                  </>
                ) : null}
              </p>
            </div>
          }
        />
      </main>
    </div>
  );
}
