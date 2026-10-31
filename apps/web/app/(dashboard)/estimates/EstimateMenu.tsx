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
import { estimateLabel, estimateReopenable } from "@/lib/office";
import {
  estimateUrl,
  officeApi,
  officeApiNoContent,
  toOfficeError,
  type OfficeApiError,
} from "../office/_ui/api";
import { CheckIcon, CopyIcon, OpenIcon, TrashIcon, XIcon } from "../office/_ui/ui";

// Menu "⋯" de um orçamento (linha da lista e topo do editor): abrir, copiar o link, duplicar,
// marcar a resposta do cliente (quando ele respondeu por telefone; com confirmação), reabrir a
// resposta marcada por engano e apagar (com confirmação). No modo "ver como" do admin
// (`readOnly`) só ficam os atalhos que não mudam nada.

export type EstimateMenuEstimate = {
  id: string;
  number: number;
  clientName: string;
  status: EstimateStatus;
  publicToken: string;
  /**
   * Opcionais: com eles o "Reopen" some quando o servidor recusaria (resposta do cliente pelo
   * link, job ligado). Sem eles o item aparece e o servidor explica o motivo (409).
   */
  jobId?: string | null;
  approvedByName?: string | null;
  declineReason?: string | null;
};

/** O que a caixa de confirmação está perguntando. */
type ConfirmKind = "approve" | "decline" | "delete";

/** Dois papéis, um sobre o outro (traço igual aos ícones do escritório). */
function DuplicateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 3.5h7.5L20 7v10.5h-2.5" />
      <path d="M4 7h8.5l3.5 3.5v10H4z" />
    </svg>
  );
}

/** Seta voltando (desfazer a resposta marcada). */
function ReopenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8.5 14 4 9.5 8.5 5" />
      <path d="M4 9.5h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

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
  /**
   * Com mudanças sem salvar, marcar, reabrir e duplicar ficam desligados (perderia o que foi
   * digitado; a cópia sairia sem as mudanças).
   */
  blockedReason?: string | null;
  triggerVariant?: "ghost" | "secondary";
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [problem, setProblem] = useState<{ title: string; error: OfficeApiError } | null>(null);
  // `confirm` guarda a pergunta mesmo depois de fechar (o texto não troca durante a animação).
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const busy = working || refreshing;
  const blocked = Boolean(blockedReason);
  const label = estimateLabel(estimate.number);

  function ask(kind: ConfirmKind) {
    setConfirmError(null);
    setConfirm(kind);
    setConfirmOpen(true);
  }

  /** Confirmou: marca a resposta ou apaga (a caixa fica aberta com o erro, se der errado). */
  async function runConfirmed() {
    if (!confirm || confirmPending) return;
    setConfirmPending(true);
    setConfirmError(null);
    try {
      if (confirm === "delete") {
        await officeApiNoContent(estimateUrl(estimate.id), { method: "DELETE" });
        setConfirmOpen(false);
        if (context === "detail") router.push("/estimates");
        router.refresh();
      } else {
        await officeApi(estimateUrl(estimate.id), EstimateResponse, {
          method: "PATCH",
          body: { status: confirm === "approve" ? "approved" : "declined" },
        });
        setConfirmOpen(false);
        startRefresh(() => router.refresh());
      }
    } catch (err) {
      setConfirmError(toOfficeError(err).message);
    } finally {
      setConfirmPending(false);
    }
  }

  async function reopen() {
    setWorking(true);
    try {
      await officeApi(estimateUrl(estimate.id, "/reopen"), EstimateResponse, { method: "POST" });
      startRefresh(() => router.refresh());
    } catch (err) {
      setProblem({ title: `Couldn't reopen ${label}`, error: toOfficeError(err) });
    } finally {
      setWorking(false);
    }
  }

  async function duplicate() {
    setWorking(true);
    try {
      const { estimate: copy } = await officeApi(
        estimateUrl(estimate.id, "/duplicate"),
        EstimateResponse,
        { method: "POST" },
      );
      startRefresh(() => router.push(`/estimates/${encodeURIComponent(copy.id)}`));
    } catch (err) {
      setProblem({ title: `Couldn't duplicate ${label}`, error: toOfficeError(err) });
    } finally {
      setWorking(false);
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
  const canReopen = estimateReopenable(estimate);

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
  if (!readOnly) {
    items.push({
      label: "Duplicate",
      icon: <DuplicateIcon />,
      onSelect: () => void duplicate(),
      disabled: busy || blocked,
      key: "duplicate",
    });
  }
  if (!readOnly && canMark) {
    items.push(
      { type: "separator", key: "mark-sep" },
      {
        label: "Mark approved",
        icon: <CheckIcon />,
        onSelect: () => ask("approve"),
        disabled: busy || blocked,
        key: "approve",
      },
      {
        label: "Mark declined",
        icon: <XIcon />,
        onSelect: () => ask("decline"),
        disabled: busy || blocked,
        key: "decline",
      },
    );
  }
  if (!readOnly && canReopen) {
    items.push(
      { type: "separator", key: "reopen-sep" },
      {
        label: "Reopen",
        icon: <ReopenIcon />,
        onSelect: () => void reopen(),
        disabled: busy || blocked,
        key: "reopen",
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
        onSelect: () => ask("delete"),
        key: "delete",
      },
    );
  }

  const client = estimate.clientName;
  const deleteText =
    estimate.status === "draft"
      ? "This draft is erased. This can’t be undone."
      : estimate.status === "approved"
        ? `${client}’s link stops working and the estimate is erased. The customer’s approval will be deleted too. This can’t be undone.`
        : `${client}’s link stops working and the estimate is erased. This can’t be undone.`;

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
      {blockedReason && !readOnly && <span className="sr-only">{blockedReason}</span>}

      {confirm && (
        <ConfirmDialog
          open={confirmOpen}
          title={
            confirm === "delete"
              ? `Delete ${label}?`
              : confirm === "approve"
                ? `Mark ${label} approved?`
                : `Mark ${label} declined?`
          }
          confirmLabel={
            confirm === "delete"
              ? "Delete estimate"
              : confirm === "approve"
                ? "Mark approved"
                : "Mark declined"
          }
          pendingLabel={confirm === "delete" ? "Deleting…" : "Saving…"}
          tone={confirm === "delete" ? "destructive" : "primary"}
          pending={confirmPending}
          error={confirmError}
          onConfirm={() => void runConfirmed()}
          onCancel={() => setConfirmOpen(false)}
        >
          {confirm === "delete"
            ? deleteText
            : confirm === "approve"
              ? `Use this when ${client} said yes by phone or in person. Their link stops taking answers. You can reopen it later if nothing was created from it yet.`
              : `Use this when ${client} said no by phone or in person. Their link stops taking answers. You can reopen it later.`}
        </ConfirmDialog>
      )}

      {problem && (
        <GlassSheet
          open
          onClose={() => setProblem(null)}
          title={problem.title}
          description={problem.error.message}
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
