"use client";

import { EstimateResponse, type EstimateStatus } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  SpinnerIcon,
  type GlassMenuItem,
} from "@/components/glass";
import { estimateLabel } from "@/lib/office";
import {
  estimateUrl,
  officeApi,
  officeApiNoContent,
  toOfficeError,
  type OfficeApiError,
} from "../office/_ui/api";
import { CheckIcon, CopyIcon, OpenIcon, TrashIcon, XIcon } from "../office/_ui/ui";

// Menu "⋯" de um orçamento (linha da lista e topo do editor): abrir, copiar o link, marcar a
// resposta do cliente (quando ele respondeu por telefone) e apagar (com confirmação). No modo
// "ver como" do admin (`readOnly`) só ficam os atalhos que não mudam nada.

export type EstimateMenuEstimate = {
  id: string;
  number: number;
  clientName: string;
  status: EstimateStatus;
  publicToken: string;
};

export function EstimateMenu({
  estimate,
  readOnly = false,
  context = "row",
  extraItems = [],
  blockedReason,
  triggerVariant = "ghost",
}: {
  estimate: EstimateMenuEstimate;
  readOnly?: boolean;
  context?: "row" | "detail";
  /** Itens do editor que vêm antes (imprimir, converter...). */
  extraItems?: GlassMenuItem[];
  /** Com mudanças sem salvar, marcar a resposta fica desligado (perderia o que foi digitado). */
  blockedReason?: string | null;
  triggerVariant?: "ghost" | "secondary";
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [problem, setProblem] = useState<OfficeApiError | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMounted, setConfirmMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const busy = working || refreshing;
  const label = estimateLabel(estimate.number);

  async function mark(status: "approved" | "declined") {
    setWorking(true);
    try {
      await officeApi(estimateUrl(estimate.id), EstimateResponse, {
        method: "PATCH",
        body: { status },
      });
      startRefresh(() => router.refresh());
    } catch (err) {
      setProblem(toOfficeError(err));
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await officeApiNoContent(estimateUrl(estimate.id), { method: "DELETE" });
      setConfirmOpen(false);
      if (context === "detail") router.push("/estimates");
      router.refresh();
    } catch (err) {
      setDeleteError(toOfficeError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/q/${encodeURIComponent(estimate.publicToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("Link copied");
    } catch {
      setCopied("Couldn't copy");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  // O link só funciona depois de enviado.
  const shared = estimate.status !== "draft";
  const canMark = estimate.status === "sent" || estimate.status === "expired";

  const items: GlassMenuItem[] = [...extraItems];
  if (context === "row") {
    items.push({
      type: "link",
      label: "Open estimate",
      href: `/estimates/${encodeURIComponent(estimate.id)}`,
      icon: <OpenIcon />,
      key: "open",
    });
  }
  if (shared) {
    items.push(
      { label: "Copy customer link", icon: <CopyIcon />, onSelect: () => void copyLink() },
      {
        type: "link",
        label: "View as customer",
        href: `/q/${encodeURIComponent(estimate.publicToken)}`,
        icon: <OpenIcon />,
        external: true,
        key: "view",
      },
    );
  }
  if (!readOnly && canMark) {
    items.push(
      { type: "separator", key: "mark-sep" },
      {
        label: "Mark approved",
        icon: <CheckIcon />,
        onSelect: () => void mark("approved"),
        disabled: busy || Boolean(blockedReason),
        key: "approve",
      },
      {
        label: "Mark declined",
        icon: <XIcon />,
        onSelect: () => void mark("declined"),
        disabled: busy || Boolean(blockedReason),
        key: "decline",
      },
    );
  }
  if (!readOnly) {
    items.push(
      { type: "separator", key: "delete-sep" },
      {
        label: "Delete estimate",
        icon: <TrashIcon />,
        destructive: true,
        onSelect: () => {
          setDeleteError(null);
          setConfirmMounted(true);
          setConfirmOpen(true);
        },
        key: "delete",
      },
    );
  }

  return (
    <>
      <GlassMenu
        items={items}
        label={`More actions for ${label}`}
        triggerVariant={triggerVariant}
        triggerIcon={busy ? <SpinnerIcon /> : undefined}
      />
      <span role="status" className="text-[13px] font-medium text-emerald-700 empty:hidden">
        {copied}
      </span>
      {blockedReason && canMark && !readOnly && (
        <span className="sr-only">{blockedReason}</span>
      )}

      {confirmMounted && (
        <ConfirmDialog
          open={confirmOpen}
          title={`Delete ${label}?`}
          confirmLabel="Delete estimate"
          pendingLabel="Deleting…"
          pending={deleting}
          error={deleteError}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmOpen(false)}
        >
          {estimate.status === "draft"
            ? "This draft is erased. This can’t be undone."
            : `${estimate.clientName}’s link stops working and the estimate is erased. This can’t be undone.`}
        </ConfirmDialog>
      )}

      {problem && (
        <GlassSheet
          open
          onClose={() => setProblem(null)}
          title={`Couldn't update ${label}`}
          description={problem.message}
          size="sm"
          footer={
            <GlassButton variant="primary" onClick={() => setProblem(null)}>
              OK
            </GlassButton>
          }
        />
      )}
    </>
  );
}
