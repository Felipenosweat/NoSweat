"use client";

import { ApiError, type CompanyExpense } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  type GlassButtonVariant,
} from "@/components/glass";
import { formatMoney } from "@/lib/finance";
import { ExpenseForm } from "./ExpenseForm";

// Ações das finanças do admin: "Add a cost" (abre a folha com o formulário) e, em cada linha, o
// menu "⋯" com Edit (mesma folha, preenchida) e Delete (confirmação). Depois de salvar ou apagar,
// router.refresh() lê a página de novo (a rota já limpou o cache do admin).

/** Folha com o formulário do custo (novo ou editar). */
function ExpenseSheet({
  open,
  onClose,
  expense,
  today,
}: {
  open: boolean;
  onClose: () => void;
  expense?: CompanyExpense;
  today: string;
}) {
  const formId = useId();
  const [pending, setPending] = useState(false);
  return (
    <GlassSheet
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      dismissible={!pending}
      title={expense ? `Edit ${expense.name}` : "Add a cost"}
      description={
        expense
          ? undefined
          : "Anything the company pays: hosting, tools, AI, fees, people. Monthly and yearly costs count toward break-even."
      }
      footer={
        <>
          <GlassButton variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" form={formId} variant="primary" loading={pending}>
            {expense ? "Save changes" : "Add cost"}
          </GlassButton>
        </>
      }
    >
      {/* Só monta aberto: cada abertura começa com os valores salvos (sem rascunho velho). */}
      {open && (
        <ExpenseForm
          formId={formId}
          expense={expense}
          today={today}
          onSaved={onClose}
          onPendingChange={setPending}
        />
      )}
    </GlassSheet>
  );
}

/** Botão "Add a cost" (cabeçalho da página e estado vazio). */
export function AddExpenseButton({
  today,
  variant = "primary",
}: {
  today: string;
  variant?: GlassButtonVariant;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GlassButton variant={variant} onClick={() => setOpen(true)}>
        Add a cost
      </GlassButton>
      <ExpenseSheet open={open} onClose={() => setOpen(false)} today={today} />
    </>
  );
}

/** Menu "⋯" de uma linha: Edit e Delete. */
export function ExpenseRowActions({
  expense,
  today,
}: {
  expense: CompanyExpense;
  today: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance/expenses/${encodeURIComponent(expense.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const apiError = ApiError.safeParse(await res.json().catch(() => null));
        setError(
          apiError.success ? apiError.data.error.message : "Something went wrong. Try again.",
        );
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <GlassMenu
        label={`More actions for ${expense.name}`}
        size="sm"
        items={[
          { label: "Edit…", onSelect: () => setEditing(true), key: "edit" },
          { type: "separator", key: "sep" },
          {
            label: "Delete…",
            destructive: true,
            onSelect: () => {
              setError(null);
              setConfirming(true);
            },
            key: "delete",
          },
        ]}
      />
      <ExpenseSheet
        open={editing}
        onClose={() => setEditing(false)}
        expense={expense}
        today={today}
      />
      <ConfirmDialog
        open={confirming}
        title={`Delete ${expense.name}?`}
        confirmLabel="Delete cost"
        pendingLabel="Deleting…"
        pending={deleting}
        error={error}
        onConfirm={() => void remove()}
        onCancel={() => {
          if (!deleting) setConfirming(false);
        }}
      >
        {formatMoney(expense.amountCents)} leaves the totals and the break-even chart. If the cost
        just stopped, set an end date instead to keep its history.
      </ConfirmDialog>
    </>
  );
}
