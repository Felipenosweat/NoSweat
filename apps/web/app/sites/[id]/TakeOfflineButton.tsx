"use client";

import { ApiError, PublishSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { secondaryButton, textButton } from "@/components/DashboardUi";

/**
 * Tirar o site do ar (POST /api/sites/[id]/unpublish), com confirmação em dois passos como o
 * DeleteSiteButton. Nada é apagado: o endereço, a versão publicada e o domínio ficam guardados
 * e "Publish" põe tudo de volta.
 */
export function TakeOfflineButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takeOffline() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/unpublish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      PublishSiteResponse.parse(body);
      setConfirming(false);
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
        className={`${textButton} hover:text-red-700`}
      >
        Take website offline
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={`Take ${siteName} offline?`}
      className="rounded-xl border border-slate-200 bg-surface p-4 text-sm"
    >
      <p className="font-medium text-ink">
        Take <span className="font-semibold">{siteName}</span> offline?
      </p>
      <p className="mt-1 text-slate-600">
        Visitors will see a not-found page until you publish again. Your address, domain and
        messages stay saved.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void takeOffline()}
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-10 items-center rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors duration-150 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Taking offline…" : "Take offline"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className={secondaryButton}
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
