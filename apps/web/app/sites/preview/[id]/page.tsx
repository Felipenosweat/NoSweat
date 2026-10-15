import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessibleSite, getActor, type Actor } from "@/server/sites";
import type { SiteRecord } from "@/server/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type PreviewPageProps = { params: Promise<{ id: string }> };

/**
 * Só quem criou vê o preview (conta, ou visitante sem conta com o próprio cookie); para
 * qualquer outra pessoa o site "não existe".
 */
async function getPreview(id: string): Promise<{ actor: Actor; site: SiteRecord } | null> {
  const actor = await getActor();
  if (!actor) return null;
  const site = await getAccessibleSite(actor, id);
  return site ? { actor, site } : null;
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const site = (await getPreview(id))?.site;
  return {
    title: site ? `${site.spec.business.name} (preview)` : "Preview",
    robots: { index: false },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const preview = await getPreview(id);
  if (!preview) {
    // Sem conta logada pode ser o dono com a sessão vencida: pede login (não revela se existe).
    const actor = await getActor();
    if (actor?.kind !== "user") {
      redirect(`/login?next=${encodeURIComponent(`/sites/preview/${id}`)}`);
    }
    notFound();
  }
  const { actor, site } = preview;
  const guest = actor.kind === "guest";
  // Publicar exige conta: o visitante cria a conta e volta para a página do site.
  const signupHref = `/signup?next=${encodeURIComponent(`/sites/${site.id}`)}`;

  return (
    <>
      {/* Barra da No Sweat: fica fora do site do cliente. */}
      <div className="flex h-10 items-center justify-between gap-4 bg-slate-950 px-4 text-xs font-medium text-slate-300">
        <p>
          Preview <span className="text-slate-500">·</span>{" "}
          <span className="text-white">No Sweat</span>
        </p>
        <div className="flex items-center gap-4">
          {!guest && (
            <Link href="/dashboard" className={`rounded-sm hover:text-white ${focusRing}`}>
              &larr; Dashboard
            </Link>
          )}
          <Link
            href={`/sites/${site.id}/edit`}
            className={`rounded-sm hover:text-white ${focusRing}`}
          >
            Edit
          </Link>
          <Link
            href={guest ? signupHref : `/sites/${site.id}`}
            className={`rounded-full bg-emerald-500 px-3 py-1 font-semibold whitespace-nowrap text-white hover:bg-emerald-400 ${focusRing}`}
          >
            {guest ? "Publish" : site.status === "published" ? "Manage" : "Publish"} &rarr;
          </Link>
        </div>
      </div>
      <SiteRenderer spec={site.spec} />
    </>
  );
}
