"use client";

import { ApiError, type SiteVersionSummary, type VersionSource } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/DashboardUi";
import { glassButtonClass } from "@/components/glass";
import { LocalTime } from "@/components/LocalTime";

const SOURCE_LABELS: Record<VersionSource, string> = {
  generate: "Created by AI",
  edit: "Edited",
  ai_edit: "Changed by AI",
  restore: "Restored",
  initial: "Original",
};

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
      <ul className="divide-y divide-(--glass-rim) border-t border-(--glass-rim)">
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
                <LocalTime iso={version.createdAt} />
              </span>
            </span>
            {index === 0 ? (
              <StatusBadge tone="neutral">Current draft</StatusBadge>
            ) : (
              <button
                type="button"
                onClick={() => restore(version.id)}
                disabled={pending !== null}
                className={`${glassButtonClass({ variant: "secondary", size: "sm" })} max-sm:min-h-11`}
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
          className="glass-edge mt-3 inline-flex rounded-xl bg-red-50/85 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
