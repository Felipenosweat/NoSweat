"use client";

import { ApiError, DeleteSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Apagar um site, com confirmação em dois passos (nada de apagar com um clique só).
 * `compact` é a versão pequena do card em "My sites"; a normal fica na página do site.
 */
export function DeleteSiteButton({
  siteId,
  siteName,
  compact = false,
  redirectTo,
}: {
  siteId: string;
  siteName: string;
  compact?: boolean;
  /** Para onde ir depois de apagar (ex.: /dashboard). Sem isso, só recarrega a página. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      DeleteSiteResponse.parse(body);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          compact
            ? "text-[13px] font-medium text-slate-500 transition-colors hover:text-red-700"
            : "rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        }
      >
        {compact ? "Delete" : "Delete this website"}
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Delete ${siteName}?`} className="text-sm">
      <p className="font-medium text-ink">
        Delete <span className="font-semibold">{siteName}</span> forever?
      </p>
      {!compact && (
        <p className="mt-1 text-slate-600">
          It goes offline, your custom domain is disconnected, and its versions and messages are
          erased. This can&rsquo;t be undone.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
        >
          {pending ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
