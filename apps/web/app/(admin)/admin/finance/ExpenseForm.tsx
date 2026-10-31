"use client";

import {
  ApiError,
  CompanyExpenseResponse,
  ExpenseCategory,
  ExpenseFrequency,
  type CompanyExpense,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Notice } from "@/components/glass";
import { parseDollars } from "@/lib/clients";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_LABELS,
  centsToDollarsInput,
} from "@/lib/finance";
import { fieldClass, labelClass, textareaClass } from "../AdminUi";

// Formulário de um custo da empresa (novo ou editar), dentro de uma folha de vidro. Manda para
// /api/admin/finance/expenses (POST) ou /api/admin/finance/expenses/[id] (PATCH); a rota confere
// se é admin e valida com o Zod. O botão de enviar fica no rodapé da folha (atributo `form`).

const OFFLINE = "We couldn't reach our servers. Please try again.";

function text(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function ExpenseForm({
  formId,
  expense,
  today,
  onSaved,
  onPendingChange,
}: {
  /** id do <form> (o botão do rodapé da folha aponta para ele). */
  formId: string;
  /** Custo a editar; sem ele, cria um novo. */
  expense?: CompanyExpense;
  /** Hoje ("AAAA-MM-DD"), data inicial de um custo novo. */
  today: string;
  onSaved: (expense: CompanyExpense) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [frequency, setFrequency] = useState<ExpenseFrequency>(expense?.frequency ?? "monthly");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setBusy(value: boolean) {
    setPending(value);
    onPendingChange(value);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const amountCents = parseDollars(text(data, "amount"));
    if (amountCents === null || amountCents === undefined) {
      setError("Enter the amount in dollars, like 25 or 19.99.");
      return;
    }
    const category = ExpenseCategory.safeParse(text(data, "category"));
    const chosenFrequency = ExpenseFrequency.safeParse(text(data, "frequency"));
    if (!category.success || !chosenFrequency.success) {
      setError("Choose a category and how often you pay.");
      return;
    }
    const startsOn = text(data, "startsOn");
    const endsOn = text(data, "endsOn");
    const body = {
      name: text(data, "name"),
      category: category.data,
      amountCents,
      frequency: chosenFrequency.data,
      ...(startsOn ? { startsOn } : {}),
      // Custo único não tem fim; vazio = sem data de fim (na edição, apaga a que havia).
      endsOn: chosenFrequency.data === "one_time" || !endsOn ? null : endsOn,
      notes: text(data, "notes"),
    };

    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        expense
          ? `/api/admin/finance/expenses/${encodeURIComponent(expense.id)}`
          : "/api/admin/finance/expenses",
        {
          method: expense ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(json);
        setError(
          apiError.success ? apiError.data.error.message : "Something went wrong. Try again.",
        );
        return;
      }
      const saved = CompanyExpenseResponse.parse(json).expense;
      router.refresh();
      onSaved(saved);
    } catch {
      setError(OFFLINE);
    } finally {
      setBusy(false);
    }
  }

  const oneTime = frequency === "one_time";

  return (
    <form id={formId} onSubmit={onSubmit} className="grid gap-4">
      <label className={labelClass}>
        Name
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={expense?.name ?? ""}
          placeholder="Vercel Pro"
          autoComplete="off"
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (USD)
          <input
            name="amount"
            required
            inputMode="decimal"
            defaultValue={expense ? centsToDollarsInput(expense.amountCents) : ""}
            placeholder="20.00"
            autoComplete="off"
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          How often
          <select
            name="frequency"
            value={frequency}
            onChange={(event) => {
              const next = ExpenseFrequency.safeParse(event.target.value);
              if (next.success) setFrequency(next.data);
            }}
            className={fieldClass}
          >
            {EXPENSE_FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_FREQUENCY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Category
        <select
          name="category"
          defaultValue={expense?.category ?? "hosting"}
          className={fieldClass}
        >
          {EXPENSE_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {EXPENSE_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {oneTime ? "Paid on" : "Starts on"}
          <input
            type="date"
            name="startsOn"
            required
            defaultValue={expense?.startsOn ?? today}
            className={fieldClass}
          />
        </label>
        {!oneTime && (
          <label className={labelClass}>
            Ends on <span className="font-normal">(optional)</span>
            <input
              type="date"
              name="endsOn"
              defaultValue={expense?.endsOn ?? ""}
              className={fieldClass}
            />
          </label>
        )}
      </div>

      <label className={labelClass}>
        Notes <span className="font-normal">(optional)</span>
        <textarea
          name="notes"
          rows={2}
          maxLength={1000}
          defaultValue={expense?.notes ?? ""}
          placeholder="Plan, account, who pays it…"
          className={textareaClass}
        />
      </label>

      {error && (
        <Notice tone="error" size="sm">
          {error}
        </Notice>
      )}
    </form>
  );
}
