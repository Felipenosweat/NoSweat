"use client";

import { ApiError, DeleteSiteResponse, PublishSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobeIcon, LinkIcon, TrashIcon } from "@/app/(dashboard)/NavIcons";
import { markShared } from "@/components/DashboardUi";
import { ConfirmDialog, GlassMenu, type GlassMenuItem } from "@/components/glass";

// Menu "⋯" de um site: ações secundárias e as que tiram/apagam (com confirmação em folha de
// vidro). Usado nos cartões do painel (/dashboard) e no topo da página do site (/sites/[id]).
// Mesmas chamadas de antes: DELETE /api/sites/[id] e POST /api/sites/[id]/unpublish (tirar do ar
// não apaga nada: endereço, versão publicada e domínio ficam guardados).

type IconProps = { className?: string };

function svgProps(className = "size-[18px]") {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
}

function PencilIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function SlidersIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function OfflineIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

type Confirm = "delete" | "offline" | null;

export function SiteActionsMenu({
  siteId,
  siteName,
  liveUrl,
  place,
  hasPendingChanges = false,
  redirectAfterDelete,
}: {
  siteId: string;
  siteName: string;
  /** Endereço público (relativo "/s/..." ou absoluto). `null` = rascunho, ainda não está no ar. */
  liveUrl: string | null;
  /** "card" = cartão do painel (Edit, Preview, Manage...); "page" = página do próprio site. */
  place: "card" | "page";
  /** Rascunho com mudanças ainda não publicadas (a prévia vira "Preview draft"). */
  hasPendingChanges?: boolean;
  /** Para onde ir depois de apagar (ex.: /dashboard). Sem isso, só recarrega a página. */
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  // O aviso "Link copied" some sozinho.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function share() {
    if (!liveUrl) return;
    const url = new URL(liveUrl, window.location.origin).toString();
    try {
      // Celular: a folha de compartilhar do sistema. Computador: copia o link.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      if (touch && typeof navigator.share === "function") {
        await navigator.share({ title: siteName, url });
        markShared(siteId);
        return;
      }
      await navigator.clipboard.writeText(url);
      markShared(siteId);
      setNotice("Link copied");
    } catch (err) {
      // Fechou a folha de compartilhar sem escolher: nada a dizer.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setNotice(`Copy your link: ${url}`);
    }
  }

  function openConfirm(kind: Exclude<Confirm, null>) {
    setError(null);
    setConfirm(kind);
  }

  async function run(kind: Exclude<Confirm, null>) {
    setPending(true);
    setError(null);
    try {
      const res =
        kind === "delete"
          ? await fetch(`/api/sites/${siteId}`, { method: "DELETE" })
          : await fetch(`/api/sites/${siteId}/unpublish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      if (kind === "delete") {
        DeleteSiteResponse.parse(body);
        setConfirm(null);
        if (redirectAfterDelete) router.push(redirectAfterDelete);
      } else {
        PublishSiteResponse.parse(body);
        setConfirm(null);
      }
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const previewLabel = hasPendingChanges ? "Preview draft" : "Preview";
  const items: GlassMenuItem[] = [];
  if (place === "card") {
    items.push(
      { type: "link", label: "Edit", href: `/sites/${siteId}/edit`, icon: <PencilIcon /> },
      { type: "link", label: previewLabel, href: `/sites/preview/${siteId}`, icon: <EyeIcon /> },
      { type: "link", label: "Manage", href: `/sites/${siteId}`, icon: <SlidersIcon /> },
    );
  } else {
    items.push({
      type: "link",
      label: previewLabel,
      href: `/sites/preview/${siteId}`,
      icon: <EyeIcon />,
    });
  }
  if (liveUrl) {
    if (place === "page") {
      items.push({
        type: "link",
        label: "View live site",
        href: liveUrl,
        external: true,
        icon: <GlobeIcon className="size-[18px]" />,
      });
    }
    items.push({ label: "Share link", onSelect: () => void share(), icon: <ShareIcon /> });
  } else {
    // Rascunho: ainda não há link. O item leva ao lugar de publicar.
    items.push({
      type: "link",
      label: "Publish to get a link",
      href: `/sites/${siteId}#publish`,
      icon: <LinkIcon className="size-[18px]" />,
    });
  }
  items.push({ type: "separator" });
  if (liveUrl && place === "page") {
    items.push({
      label: "Take website offline",
      onSelect: () => openConfirm("offline"),
      icon: <OfflineIcon />,
      destructive: true,
    });
  }
  items.push({
    label: "Delete website",
    onSelect: () => openConfirm("delete"),
    icon: <TrashIcon className="size-[18px]" />,
    destructive: true,
  });

  return (
    <>
      <GlassMenu
        items={items}
        label={`More actions for ${siteName}`}
        triggerVariant={place === "page" ? "secondary" : "ghost"}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title={`Delete ${siteName}?`}
        confirmLabel="Delete website"
        pendingLabel="Deleting…"
        pending={pending && confirm === "delete"}
        error={confirm === "delete" ? error : null}
        onConfirm={() => void run("delete")}
        onCancel={() => setConfirm(null)}
      >
        It goes offline, your custom domain is disconnected, and its versions and messages are
        erased. Deleting doesn&rsquo;t give back AI credits. This can&rsquo;t be undone.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "offline"}
        title={`Take ${siteName} offline?`}
        confirmLabel="Take offline"
        pendingLabel="Taking offline…"
        pending={pending && confirm === "offline"}
        error={confirm === "offline" ? error : null}
        onConfirm={() => void run("offline")}
        onCancel={() => setConfirm(null)}
      >
        Visitors will see a not-found page until you publish again. Your address, domain and
        messages stay saved.
      </ConfirmDialog>
      {/* Aviso do "Share link": sempre no DOM para o leitor de tela anunciar quando muda. */}
      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>
      {notice && (
        <p
          aria-hidden="true"
          className="glass-strong glass-pop fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)] left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full px-4 py-2 text-[15px] font-medium [overflow-wrap:anywhere] text-(--glass-fg) lg:bottom-6"
        >
          {notice}
        </p>
      )}
    </>
  );
}
