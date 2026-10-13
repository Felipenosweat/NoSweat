"use client";

import { ApiError, PublishSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";
import { PublishDialog } from "./PublishDialog";

/**
 * Ações de publicação. Fica SEMPRE montado na página (mesmo depois de publicar), para o
 * diálogo "You're live." continuar aberto quando o `router.refresh()` troca o botão.
 * - `label`: texto do botão de publicar; `null` = nada para publicar (site no ar e em dia).
 * - `liveUrl`: endereço grátis já no ar; mostra "Share" para reabrir o diálogo.
 */
export function PublishButton({
  siteId,
  siteName,
  label = "Publish my website",
  liveUrl = null,
  hasDomain = false,
}: {
  siteId: string;
  siteName: string;
  label?: string | null;
  liveUrl?: string | null;
  hasDomain?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogUrl, setDialogUrl] = useState<string | null>(null);
  const shareRef = useRef<HTMLButtonElement>(null);

  async function publish() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      const published = PublishSiteResponse.parse(body);
      setDialogUrl(published.url);
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const shareUrl = liveUrl ?? dialogUrl;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {label && (
          <button
            type="button"
            onClick={publish}
            disabled={pending}
            aria-busy={pending}
            className={`${primaryButton} disabled:cursor-wait`}
          >
            {pending ? "Publishing…" : label}
          </button>
        )}
        {shareUrl && (
          <button
            ref={shareRef}
            type="button"
            onClick={() => setDialogUrl(shareUrl)}
            className={secondaryButton}
          >
            Share your link
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 inline-flex rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {dialogUrl && (
        <PublishDialog
          open
          url={dialogUrl}
          siteId={siteId}
          siteName={siteName}
          showDomainAction={!hasDomain}
          onClose={() => setDialogUrl(null)}
          returnFocusTo={() => shareRef.current}
        />
      )}
    </div>
  );
}
