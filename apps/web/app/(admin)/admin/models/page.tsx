import { TemplateId } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  StatusBadge,
  cardClass,
  focusRing,
  panelText,
  sectionTitle,
} from "@/components/DashboardUi";
import { SiteThumb } from "@/components/SiteThumb";
import { CATEGORY_LABELS } from "@/lib/model-studio";
import { requireAdmin } from "@/server/admin";
import { listModels, summarize, type StudioModel } from "@/server/models";
import { ModelActions } from "./ModelActions";

export const metadata: Metadata = { title: "Model studio", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const linkClass = `inline-flex min-h-10 items-center rounded-lg px-1 text-[15px] font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

/** O que a geração usa deste modelo hoje, em uma linha. */
function usageNote(model: StudioModel): string {
  if (model.source === "studio") {
    return model.inUse ? "In use for new sites" : "Not in use until approved";
  }
  if (model.usesStudioVersion) return "In use: your approved version";
  return model.updatedAt
    ? "In use: original version (your edit is a draft)"
    : "In use: original version";
}

function ModelCard({ model }: { model: StudioModel }) {
  const slug = encodeURIComponent(model.slug);
  return (
    <li className={`${cardClass} flex flex-col overflow-hidden`}>
      <Link
        href={`/admin/models/${slug}/preview`}
        className={`block border-b border-slate-200/70 ${focusRing}`}
      >
        <SiteThumb spec={model.spec} />
        <span className="sr-only">Preview {model.name}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h3 className="font-display text-[17px] leading-6 font-semibold text-ink">
            {model.name}
          </h3>
          <p className="text-[13px] text-slate-500">
            {model.slug}
            {model.spec.design?.composition ? ` · ${model.spec.design.composition}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge tone="neutral">{model.source === "code" ? "Code" : "Studio"}</StatusBadge>
            {model.edited && <StatusBadge tone="info">Edited</StatusBadge>}
            {model.status === "approved" ? (
              <StatusBadge tone="live">Approved</StatusBadge>
            ) : (
              <StatusBadge tone="draft">Draft</StatusBadge>
            )}
          </div>
          <p className="mt-2 text-[13px] text-slate-600">{usageNote(model)}</p>
          {model.updatedAt && (
            <p className="text-[13px] text-slate-500">
              Saved {dateFormat.format(new Date(model.updatedAt))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4">
          <Link href={`/admin/models/${slug}/edit`} className={linkClass}>
            Edit
          </Link>
          <Link href={`/admin/models/${slug}/preview`} className={linkClass}>
            Preview
          </Link>
        </div>
        <ModelActions model={summarize(model)} />
      </div>
    </li>
  );
}

/**
 * Estúdio de modelos: os sites-modelo que a geração usa como ponto de partida, por categoria.
 * Editar → rascunho; Aprovar → a geração passa a usar esta versão (em até 1 minuto).
 */
export default async function ModelsPage() {
  await requireAdmin();
  const models = await listModels();
  const approved = models.filter((model) => model.status === "approved").length;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Model studio"
        description={`New customer sites start from these models. Edit a model, then approve it: approved versions replace the original for new sites. ${approved} of ${models.length} approved.`}
      />
      {TemplateId.options.map((category) => {
        const group = models.filter((model) => model.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`models-${category}`}>
            <h2 id={`models-${category}`} className={sectionTitle}>
              {CATEGORY_LABELS[category]}{" "}
              <span className="text-base font-medium text-slate-500">({group.length})</span>
            </h2>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((model) => (
                <ModelCard key={model.slug} model={model} />
              ))}
            </ul>
          </section>
        );
      })}
      <p className={panelText}>
        Edits save as a draft and stay out of new sites until you approve them. Duplicated models
        join the pool only when approved, and are picked by their keywords.
      </p>
    </div>
  );
}
