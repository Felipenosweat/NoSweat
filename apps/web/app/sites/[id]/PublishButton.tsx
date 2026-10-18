"use client";

import { ApiError, PublishSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";
import { PublishDialog, type PublishState } from "./PublishDialog";

/**
 * Ações de publicação da página do site. O botão abre o modal "Publish website", que faz o
 * POST /api/sites/[id]/publish. Fica SEMPRE montado (mesmo depois de publicar), para o modal
 * continuar aberto quando o `router.refresh()` troca o botão.
 * - `label`: texto do botão de publicar; `null` = nada para publicar (site no ar e em dia).
 * - `liveUrl`: endereço grátis já no ar; mostra "Share your link" (abre o mesmo modal).
 * - `address`: endereço grátis (o atual ou o que o site vai ter ao publicar).
 */
export function PublishButton({
  siteId,
  siteName,
  label = "Publish my website",
  liveUrl = null,
  address,
  state,
  hasDomain = false,
}: {
  siteId: string;
  siteName: string;
  label?: string | null;
  liveUrl?: string | null;
  address: string;
  state: PublishState;
  hasDomain?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Publicado agora, antes de o `router.refresh()` trazer o estado novo da página. */
  const [justPublished, setJustPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const shareRef = useRef<HTMLButtonElement>(null);

  async function publish() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        // Sem plano ativo: vai escolher um (e volta para este site depois de pagar).
        if (apiError.success && apiError.data.error.code === "payment_required") {
          router.push(`/billing?site=${encodeURIComponent(siteId)}`);
          return;
        }
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      const published = PublishSiteResponse.parse(body);
      setPublishedUrl(published.url);
      setJustPublished(true);
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function openDialog() {
    setError(null);
    setOpen(true);
  }

  const shareUrl = liveUrl ?? publishedUrl;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {label && !justPublished && (
          <button type="button" onClick={openDialog} className={primaryButton}>
            {label}
          </button>
        )}
        {shareUrl && (
          <button ref={shareRef} type="button" onClick={openDialog} className={secondaryButton}>
            Share your link
          </button>
        )}
      </div>
      <PublishDialog
        open={open}
        onClose={() => setOpen(false)}
        siteId={siteId}
        siteName={siteName}
        state={justPublished ? "current" : state}
        address={publishedUrl ?? address}
        onPublish={() => void publish()}
        pending={pending}
        error={error}
        domain={{ href: "#domain", samePage: true, connected: hasDomain }}
        returnFocusTo={() => shareRef.current}
      />
    </div>
  );
}
