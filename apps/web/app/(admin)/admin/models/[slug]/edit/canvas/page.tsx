import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorCanvas } from "@/app/sites/[id]/edit/canvas/EditorCanvas";
import { requireAdmin } from "@/server/admin";
import { getModel } from "@/server/models";

// Prévia ao vivo do editor no modo modelo (dentro do iframe). Por cima do layout do /admin, com
// a própria rolagem, para o site ocupar a janela toda do iframe.
export const metadata: Metadata = {
  title: "Model preview",
  robots: { index: false, follow: false },
};

type CanvasPageProps = { params: Promise<{ slug: string }> };

export default async function ModelCanvasPage({ params }: CanvasPageProps) {
  await requireAdmin();
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) notFound();
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
      <EditorCanvas initialSpec={model.spec} />
    </div>
  );
}
