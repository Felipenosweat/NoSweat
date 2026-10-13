"use client";

import { ApiError, type SiteVersionSummary, type VersionSource } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <ul className="divide-y divide-slate-100">
        {versions.map((version, index) => (
          <li key={version.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span>
              <span className="font-medium">{SOURCE_LABELS[version.source]}</span>
              <span className="ml-2 text-slate-400">
                {dateFormat.format(new Date(version.createdAt))}
              </span>
            </span>
            {index === 0 ? (
              <span className="text-xs font-semibold text-slate-400">Current draft</span>
            ) : (
              <button
                type="button"
                onClick={() => restore(version.id)}
                disabled={pending !== null}
                className="text-sm font-semibold text-sky-700 hover:underline disabled:opacity-50"
              >
                {pending === version.id ? "Restoring..." : "Restore"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
