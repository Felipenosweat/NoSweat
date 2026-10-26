import type { Metadata } from "next";
import { connection } from "next/server";
import { cx } from "@/components/glass";
import { requireAdmin } from "@/server/admin";
import {
  AI_COST_PER_USE_USD,
  AI_USAGE_KINDS,
  AI_USAGE_LABELS,
  estimateAiCostUsd,
  estimateKindCostUsd,
  formatUsd,
  formatUsdPerUse,
  totalUses,
} from "@/server/admin/costs";
import { loadAiUsage } from "@/server/admin/data";
import { AdminPageHeader, StatTile, rowClass, td, th } from "../AdminUi";
import { formatCount } from "../admin-data";

export const metadata: Metadata = { title: "Usage · Admin" };

/** Uso da IA de todo mundo (contas e visitantes) e o custo ESTIMADO (preço fixo por uso). */
export default async function AdminUsagePage() {
  await connection();
  await requireAdmin();
  // Só as contagens da IA (antes esta aba lia também todas as contas e todos os sites).
  const { ai24h, ai30d } = await loadAiUsage();

  return (
    <div className="grid grid-cols-1 gap-6">
      <AdminPageHeader
        title="AI usage"
        description="Every account and every visitor without an account. Costs are an estimate from a fixed price per use, not your AI provider’s bill."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Uses · 24h" value={ai24h ? formatCount(totalUses(ai24h)) : "—"} />
        <StatTile
          label="Est. cost · 24h"
          value={ai24h ? formatUsd(estimateAiCostUsd(ai24h)) : "—"}
        />
        <StatTile label="Uses · 30 days" value={ai30d ? formatCount(totalUses(ai30d)) : "—"} />
        <StatTile
          label="Est. cost · 30 days"
          value={ai30d ? formatUsd(estimateAiCostUsd(ai30d)) : "—"}
        />
      </div>

      <section aria-labelledby="usage-heading" className="glass overflow-x-auto rounded-2xl">
        <h2 id="usage-heading" className="sr-only">
          Usage by AI feature
        </h2>
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr>
              <th className={th}>AI feature</th>
              <th className={cx(th, "text-right")}>Last 24h</th>
              <th className={cx(th, "text-right")}>Last 30 days</th>
              <th className={cx(th, "text-right")}>Est. per use</th>
              <th className={cx(th, "text-right")}>Est. cost · 30 days</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {AI_USAGE_KINDS.map((kind) => (
              <tr key={kind} className={rowClass}>
                <td className={cx(td, "font-medium text-(--glass-fg)")}>{AI_USAGE_LABELS[kind]}</td>
                <td className={cx(td, "text-right")}>{formatCount(ai24h?.[kind] ?? null)}</td>
                <td className={cx(td, "text-right")}>{formatCount(ai30d?.[kind] ?? null)}</td>
                <td className={cx(td, "text-right text-(--glass-fg-muted)")}>
                  {formatUsdPerUse(AI_COST_PER_USE_USD[kind])}
                </td>
                <td className={cx(td, "text-right")}>
                  {ai30d ? formatUsd(estimateKindCostUsd(kind, ai30d[kind])) : "—"}
                </td>
              </tr>
            ))}
            <tr className="border-t border-(--glass-rim) font-semibold text-(--glass-fg)">
              <td className={td}>Total</td>
              <td className={cx(td, "text-right")}>
                {ai24h ? formatCount(totalUses(ai24h)) : "—"}
              </td>
              <td className={cx(td, "text-right")}>
                {ai30d ? formatCount(totalUses(ai30d)) : "—"}
              </td>
              <td className={td} />
              <td className={cx(td, "text-right")}>
                {ai30d ? formatUsd(estimateAiCostUsd(ai30d)) : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
