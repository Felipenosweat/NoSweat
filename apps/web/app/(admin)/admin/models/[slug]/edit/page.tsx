import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteEditor } from "@/app/sites/[id]/edit/SiteEditor";
import { requireAdmin } from "@/server/admin";
import { getModel } from "@/server/models";

export const metadata: Metadata = { title: "Edit model", robots: { index: false } };

type EditModelPageProps = { params: Promise<{ slug: string }> };

/**
 * O editor de sites de verdade, no modo modelo: salva como rascunho do modelo e, no lugar de
 * "Publish", tem "Approve model". Ocupa a tela toda por cima do layout do /admin.
 */
export default async function EditModelPage({ params }: EditModelPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) notFound();
  const encoded = encodeURIComponent(model.slug);
  return (
    <div className="fixed inset-0 z-[60] bg-surface">
      <SiteEditor
        siteId={model.slug}
        initialSpec={model.spec}
        status="draft"
        freeAddress=""
        updatedAt={model.updatedAt ?? undefined}
        // Admins não têm limite de IA.
        aiEditsLeft={null}
        model={{
          status: model.status,
          apiUrl: `/api/admin/models/${encoded}`,
          canvasUrl: `/admin/models/${encoded}/edit/canvas`,
          previewUrl: `/admin/models/${encoded}/preview`,
          backHref: "/admin/models",
        }}
      />
    </div>
  );
}
