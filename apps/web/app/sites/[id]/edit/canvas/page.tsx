import type { Metadata } from "next";
import { requireEditableSite } from "../guard";
import { EditorCanvas } from "./EditorCanvas";

// Prévia do editor, aberta dentro de um iframe da própria página do editor. Ser uma página
// de verdade faz as media/container queries do site responderem à largura escolhida
// (computador, tablet, celular). Mesma proteção do editor; nunca indexada.
export const metadata: Metadata = {
  title: "Editor preview",
  robots: { index: false, follow: false },
};

type CanvasPageProps = { params: Promise<{ id: string }> };

export default async function EditorCanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;
  const { site } = await requireEditableSite(id);
  // Desenha o rascunho salvo na hora; o editor manda as mudanças ao vivo por postMessage.
  return <EditorCanvas initialSpec={site.spec} />;
}
