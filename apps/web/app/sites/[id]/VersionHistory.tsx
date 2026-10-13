"use client";

import { ApiError, type SiteVersionSummary, type VersionSource } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge, focusRing } from "@/components/DashboardUi";

const SOURCE_LABELS: Record<VersionSource, string> = {
  generate: "Created by AI",
  edit: "Edited",
  ai_edit: "Changed by AI",
  restore: "Restored",
  initial: "Original",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function VersionHistory({
  siteId,
  versions,
}: {
  siteId: string;
  versions: SiteVersionSummary[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(versionId: string) {
    setPending(versionId);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = ApiError.safeParse(await res.json().catch(() => null));
        setError(body.success ? body.data.error.message : "We couldn't restore this version.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(null);
    }
  }

  if (versions.length === 0) return null;

  return (
    <div className="mt-4">
      <ul className="divide-y divide-slate-200 border-t border-slate-200">
        {versions.map((version, index) => (
          <li
            key={version.id}
            className="flex min-h-14 items-center justify-between gap-4 py-2.5 text-[15px]"
          >
            <span className="min-w-0">
              <span className="block font-medium text-ink sm:inline">
                {SOURCE_LABELS[version.source]}
              </span>
              <span className="block text-[13px] text-slate-500 tabular-nums sm:ml-2 sm:inline">
                {dateFormat.format(new Date(version.createdAt))}
              </span>
            </span>
            {index === 0 ? (
              <StatusBadge tone="neutral">Current draft</StatusBadge>
            ) : (
              <button
                type="button"
                onClick={() => restore(version.id)}
                disabled={pending !== null}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-9 ${focusRing}`}
              >
                {pending === version.id ? "Restoring…" : "Restore"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p
          role="alert"
          className="mt-3 inline-flex rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
