import { TemplateId } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { GlassBadge, GlassCard, cx, focusRing } from "@/components/glass";
import { SiteThumb } from "@/components/SiteThumb";
import { CATEGORY_LABELS } from "@/lib/model-studio";
import { requireAdmin } from "@/server/admin";
import { listModels, summarize, type StudioModel } from "@/server/models";
import { AdminPageHeader, panelText } from "../../AdminUi";
import { ModelActions } from "../ModelActions";

export const metadata: Metadata = { title: "Model studio", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

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
    <GlassCard as="li" padding="none" className="flex flex-col overflow-hidden">
      <Link
        href={`/admin/models/${slug}/preview`}
        className={cx("block border-b border-(--glass-rim)", focusRing)}
      >
        <SiteThumb spec={model.spec} />
        <span className="sr-only">Preview {model.name}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-display text-[17px] leading-6 font-semibold break-words text-(--glass-fg)">
              {model.name}
            </h3>
            {model.status === "approved" ? (
              <GlassBadge tone="live" size="sm">
                Approved
              </GlassBadge>
            ) : (
              <GlassBadge tone="draft" size="sm">
                Draft
              </GlassBadge>
            )}
          </div>
          <p className="mt-0.5 text-[13px] break-all text-(--glass-fg-muted)">
            {model.slug}
            {model.spec.design?.composition ? ` · ${model.spec.design.composition}` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <GlassBadge tone="neutral" size="sm">
              {model.source === "code" ? "Code" : "Studio"}
            </GlassBadge>
            {model.edited && (
              <GlassBadge tone="info" size="sm">
                Edited
              </GlassBadge>
            )}
          </div>
          <p className="mt-2.5 text-[13px] text-(--glass-fg)">{usageNote(model)}</p>
          {model.updatedAt && (
            <p className="text-[13px] text-(--glass-fg-muted)">
              Saved {dateFormat.format(new Date(model.updatedAt))}
            </p>
          )}
        </div>
        <ModelActions model={summarize(model)} />
      </div>
    </GlassCard>
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
      <AdminPageHeader
        title="Model studio"
        count={`${approved} of ${models.length} approved`}
        description="New customer sites start from these models. Edit a model, then approve it: approved versions replace the original for new sites."
      />
      {TemplateId.options.map((category) => {
        const group = models.filter((model) => model.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`models-${category}`}>
            <h2
              id={`models-${category}`}
              className="font-display text-xl leading-7 font-semibold tracking-[-0.012em] text-(--glass-fg)"
            >
              {CATEGORY_LABELS[category]}{" "}
              <span className="text-base font-medium text-(--glass-fg-muted) tabular-nums">
                ({group.length})
              </span>
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
