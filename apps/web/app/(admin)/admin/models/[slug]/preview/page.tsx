import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/admin";
import { getModel } from "@/server/models";

export const metadata: Metadata = { title: "Model preview", robots: { index: false } };

type PreviewModelPageProps = { params: Promise<{ slug: string }> };

const barLink =
  "rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** O modelo como ele é hoje (versão do estúdio, se houver; senão a do código), em tela cheia. */
export default async function PreviewModelPage({ params }: PreviewModelPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) notFound();
  const encoded = encodeURIComponent(model.slug);
  const version = model.updatedAt ? "studio version" : "original version";
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      {/* Barra da No Sweat: fica fora do site. */}
      <div className="flex h-10 items-center justify-between gap-4 bg-slate-950 px-4 text-xs font-medium text-slate-300">
        <p className="truncate">
          Model preview <span className="text-slate-500">·</span>{" "}
          <span className="text-white">{model.slug}</span> <span className="text-slate-500">·</span>{" "}
          {model.status === "approved" ? "Approved" : "Draft"}, {version}
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/admin/models" className={barLink}>
            &larr; Models
          </Link>
          <Link href={`/admin/models/${encoded}/edit`} className={barLink}>
            Edit
          </Link>
        </div>
      </div>
      <SiteRenderer spec={model.spec} />
    </div>
  );
}
