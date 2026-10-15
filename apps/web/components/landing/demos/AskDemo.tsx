import { StatusBadge } from "@/components/DashboardUi";
import { SparklesIcon } from "@/components/marketing/icons";

// Painel "Describe a change" do editor: o dono pede em linguagem natural e recebe um rascunho
// novo (nada vai ao ar antes de publicar). Pedido e resposta de exemplo.

export function AskPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-ink shadow-[0_20px_40px_-20px_rgb(7_27_51/.35)]">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <SparklesIcon className="size-3.5 text-brand" />
        Describe a change
      </p>
      <p className="mt-2 rounded-lg bg-surface px-2.5 py-2 text-sm leading-snug ring-1 ring-slate-200">
        Add Saturday hours, 9 to 2.
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <StatusBadge tone="draft">Draft</StatusBadge>
        Done. New draft ready to review.
      </p>
    </div>
  );
}
