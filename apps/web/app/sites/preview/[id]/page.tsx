import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnedSite } from "@/server/sites";
import type { SiteRecord } from "@/server/store";

type PreviewPageProps = { params: Promise<{ id: string }> };

/** Só o dono vê o preview; para qualquer outra pessoa o site "não existe". */
async function getOwnSite(id: string): Promise<SiteRecord | null> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/preview/${encodeURIComponent(id)}`);
  return getOwnedSite(user, id);
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const site = await getOwnSite(id);
  return {
    title: site ? `${site.spec.business.name} (preview)` : "Preview",
    robots: { index: false },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const site = await getOwnSite(id);
  if (!site) notFound();

  return (
    <>
      {/* Barra da No Sweat: fica fora do site do cliente. */}
      <div className="flex h-10 items-center justify-between gap-4 bg-slate-950 px-4 text-xs font-medium text-slate-300">
        <p>
          Preview <span className="text-slate-500">·</span>{" "}
          <span className="text-white">No Sweat</span>
        </p>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-white">
            &larr; My sites
          </Link>
          <Link
            href={`/sites/${site.id}`}
            className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-white hover:bg-emerald-400"
          >
            {site.status === "published" ? "Manage" : "Publish"} &rarr;
          </Link>
        </div>
      </div>
      <SiteRenderer spec={site.spec} />
    </>
  );
}
