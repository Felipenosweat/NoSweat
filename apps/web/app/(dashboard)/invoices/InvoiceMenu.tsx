"use client";

import { InvoiceResponse, type InvoiceStatus } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog, GlassMenu, SpinnerIcon, type GlassMenuItem } from "@/components/glass";
import { invoiceLabel } from "@/lib/office";
import {
  invoiceUrl,
  officeApi,
  officeApiNoContent,
  toOfficeError,
} from "../office/_ui/api";
import { CopyIcon, OpenIcon, SlashIcon, TrashIcon } from "../office/_ui/ui";

// Menu "⋯" de uma fatura (linha da lista e topo da fatura): abrir, copiar o link, anular e apagar
// (as duas com confirmação, e só sem pagamento registrado). No modo "ver como" do admin
// (`readOnly`) só ficam os atalhos que não mudam nada.

export type InvoiceMenuInvoice = {
  id: string;
  number: number;
  clientName: string;
  status: InvoiceStatus;
  publicToken: string;
  paymentsCount: number;
};

type Confirm = "void" | "delete" | null;

export function InvoiceMenu({
  invoice,
  readOnly = false,
  context = "row",
  extraItems = [],
  triggerVariant = "ghost",
  onVoided,
}: {
  invoice: InvoiceMenuInvoice;
  readOnly?: boolean;
  context?: "row" | "detail";
  /** Itens do editor que vêm antes (imprimir...). */
  extraItems?: GlassMenuItem[];
  triggerVariant?: "ghost" | "secondary";
  /** O editor atualiza a tela na hora (sem esperar o router.refresh). */
  onVoided?: () => void;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const label = invoiceLabel(invoice.number);
  const noPayments = invoice.paymentsCount === 0;

  async function run() {
    setPending(true);
    setError(null);
    try {
      if (confirm === "void") {
        await officeApi(invoiceUrl(invoice.id), InvoiceResponse, {
          method: "PATCH",
          body: { status: "void" },
        });
        setConfirm(null);
        onVoided?.();
        startRefresh(() => router.refresh());
      } else if (confirm === "delete") {
        await officeApiNoContent(invoiceUrl(invoice.id), { method: "DELETE" });
        setConfirm(null);
        if (context === "detail") router.push("/invoices");
        router.refresh();
      }
    } catch (err) {
      setError(toOfficeError(err).message);
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/i/${encodeURIComponent(invoice.publicToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("Link copied");
    } catch {
      setCopied("Couldn't copy");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  function ask(next: Exclude<Confirm, null>) {
    setError(null);
    setMounted(true);
    setConfirm(next);
  }

  const items: GlassMenuItem[] = [...extraItems];
  if (context === "row") {
    items.push({
      type: "link",
      label: "Open invoice",
      href: `/invoices/${encodeURIComponent(invoice.id)}`,
      icon: <OpenIcon />,
      key: "open",
    });
  }
  if (invoice.status !== "draft") {
    items.push(
      { label: "Copy customer link", icon: <CopyIcon />, onSelect: () => void copyLink() },
      {
        type: "link",
        label: "View as customer",
        href: `/i/${encodeURIComponent(invoice.publicToken)}`,
        icon: <OpenIcon />,
        external: true,
        key: "view",
      },
    );
  }
  if (!readOnly && noPayments) {
    const canVoid = invoice.status !== "void" && invoice.status !== "draft";
    items.push({ type: "separator", key: "danger-sep" });
    if (canVoid) {
      items.push({
        label: "Void invoice",
        icon: <SlashIcon />,
        destructive: true,
        onSelect: () => ask("void"),
        key: "void",
      });
    }
    items.push({
      label: "Delete invoice",
      icon: <TrashIcon />,
      destructive: true,
      onSelect: () => ask("delete"),
      key: "delete",
    });
  }

  return (
    <>
      <GlassMenu
        items={items}
        label={`More actions for ${label}`}
        triggerVariant={triggerVariant}
        triggerIcon={refreshing ? <SpinnerIcon /> : undefined}
      />
      <span role="status" className="text-[13px] font-medium text-emerald-700 empty:hidden">
        {copied}
      </span>

      {mounted && (
        <ConfirmDialog
          open={confirm !== null}
          title={confirm === "void" ? `Void ${label}?` : `Delete ${label}?`}
          confirmLabel={confirm === "void" ? "Void invoice" : "Delete invoice"}
          pendingLabel={confirm === "void" ? "Voiding…" : "Deleting…"}
          pending={pending}
          error={error}
          onConfirm={() => void run()}
          onCancel={() => setConfirm(null)}
        >
          {confirm === "void"
            ? `${invoice.clientName} won’t owe anything on it. The invoice stays in your records marked “Void”. This can’t be undone.`
            : invoice.status === "draft"
              ? "This draft is erased. This can’t be undone."
              : `${invoice.clientName}’s link stops working and the invoice is erased. To keep a record, void it instead. This can’t be undone.`}
        </ConfirmDialog>
      )}
    </>
  );
}
