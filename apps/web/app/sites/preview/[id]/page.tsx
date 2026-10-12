import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteStore } from "@/server/store";

type PreviewPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const site = await getSiteStore().get(id);
  return {
    title: site ? `${site.spec.business.name} (preview)` : "Preview",
    robots: { index: false },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const site = await getSiteStore().get(id);
  if (!site) notFound();

  return (
    <>
      {/* Barra da No Sweat: fica fora do site do cliente. */}
      <div className="flex h-10 items-center justify-between gap-4 bg-slate-950 px-4 text-xs font-medium text-slate-300">
        <p>
          Preview <span className="text-slate-500">·</span>{" "}
          <span className="text-white">No Sweat</span>
        </p>
        <Link href="/dashboard" className="hover:text-white">
          &larr; My sites
        </Link>
      </div>
      <SiteRenderer spec={site.spec} />
    </>
  );
}
