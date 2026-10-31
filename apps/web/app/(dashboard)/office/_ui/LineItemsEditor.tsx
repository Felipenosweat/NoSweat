"use client";

import type { DocumentTotals } from "@nosweat/schema";
import { useId, useRef, useState, type ReactNode } from "react";
import { GlassButton, GlassIconButton, Notice } from "@/components/glass";
import {
  formatCents,
  formatQuantity,
  formatTaxRate,
  lineTotalCents,
  parseDollars,
  parsePercentToBps,
  parseQuantity,
} from "@/lib/office";
import {
  blankLine,
  isUnpricedLine,
  lineFromPriceItem,
  type DraftLine,
  type LineErrors,
} from "./draft";
import { PriceBookPicker } from "./PriceBookPicker";
import {
  PlusIcon,
  TotalRow,
  TrashIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  textButtonClass,
} from "./ui";

// Itens e totais de um orçamento/fatura. Cada linha é um cartão (no celular os campos empilham):
// nome, descrição (só quando o dono pede ou já existe), quantidade × preço, "Taxable" (só com
// imposto) e o valor da linha. Linhas novas vêm da tabela de preços (um toque) ou em branco. Sem
// reordenar (não precisa no começo).

const smallField = `${fieldClass} h-11`;

function LineCard({
  line,
  index,
  errors,
  showTax,
  warnId,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  index: number;
  errors: LineErrors | undefined;
  showTax: boolean;
  /** Id do aviso "sem preço" quando ele está na tela (a linha sem preço aponta para ele). */
  warnId: string | undefined;
  onChange: (next: DraftLine) => void;
  onRemove: () => void;
}) {
  const ids = useId();
  // Descrição fechada até o dono pedir; linha que já tem descrição mostra a caixa.
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const showDescription = descriptionOpen || line.description !== "";
  const unpriced = warnId !== undefined && !errors?.unitPrice && isUnpricedLine(line);
  const quantity = parseQuantity(line.quantity) ?? 0;
  const price = parseDollars(line.unitPrice) ?? 0;
  const amount = lineTotalCents({ quantity, unitPriceCents: price });
  const label = line.name.trim() || `Line ${index + 1}`;
  const invalid = (field: keyof LineErrors) =>
    errors?.[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${ids}-${field}-error` }
      : {};

  return (
    <li className="glass-inset rounded-xl p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${ids}-name`} className="sr-only">
            Item name, line {index + 1}
          </label>
          <input
            id={`${ids}-name`}
            data-line-name={line.key}
            value={line.name}
            onChange={(event) => onChange({ ...line, name: event.target.value })}
            placeholder="Item or service"
            maxLength={120}
            autoComplete="off"
            className={`${smallField} font-semibold`}
            {...invalid("name")}
          />
          {errors?.name && (
            <p id={`${ids}-name-error`} className={fieldErrorClass}>
              {errors.name}
            </p>
          )}
        </div>
        <GlassIconButton label={`Remove ${label}`} variant="ghost" onClick={onRemove}>
          <TrashIcon />
        </GlassIconButton>
      </div>

      {showDescription ? (
        <>
          <label htmlFor={`${ids}-description`} className="sr-only">
            Description, line {index + 1}
          </label>
          <textarea
            id={`${ids}-description`}
            value={line.description}
            onChange={(event) => onChange({ ...line, description: event.target.value })}
            placeholder="Description (optional)"
            rows={1}
            maxLength={1000}
            className={`${fieldClass} mt-2 min-h-11 resize-y py-2.5 text-[15px] leading-[1.5]`}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDescriptionOpen(true);
            // Depois de desenhar a caixa.
            window.requestAnimationFrame(() => {
              document.getElementById(`${ids}-description`)?.focus();
            });
          }}
          className={`${textButtonClass} mt-0.5`}
        >
          <PlusIcon />
          Add description
          <span className="sr-only">, line {index + 1}</span>
        </button>
      )}

      <div
        className={
          showTax
            ? "mt-2 grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[6rem_9rem_auto_1fr] sm:items-center"
            : "mt-2 grid grid-cols-[minmax(0,4.5rem)_minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[6rem_9rem_1fr]"
        }
      >
        <div>
          <label
            htmlFor={`${ids}-qty`}
            className="block text-[12px] font-medium text-(--glass-fg-muted)"
          >
            Qty
          </label>
          <input
            id={`${ids}-qty`}
            inputMode="decimal"
            value={line.quantity}
            onChange={(event) => onChange({ ...line, quantity: event.target.value })}
            autoComplete="off"
            className={`${smallField} mt-1 tabular-nums`}
            {...invalid("quantity")}
          />
        </div>
        <div>
          <label
            htmlFor={`${ids}-price`}
            className="block text-[12px] font-medium text-(--glass-fg-muted)"
          >
            Price
          </label>
          <div className="relative mt-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--glass-fg-muted)"
            >
              $
            </span>
            <input
              id={`${ids}-price`}
              inputMode="decimal"
              value={line.unitPrice}
              onChange={(event) => onChange({ ...line, unitPrice: event.target.value })}
              placeholder="0.00"
              autoComplete="off"
              className={`${smallField} pl-7 tabular-nums data-unpriced:border-amber-500 data-unpriced:bg-amber-50/80`}
              data-unpriced={unpriced ? "" : undefined}
              {...(unpriced ? { "aria-describedby": warnId } : {})}
              {...invalid("unitPrice")}
            />
          </div>
        </div>
        {/* "Taxable" só pesa com imposto: sem taxa, a caixa some (o valor guardado não muda). */}
        {showTax && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] text-ink sm:mt-5">
            <input
              type="checkbox"
              checked={line.taxable}
              onChange={(event) => onChange({ ...line, taxable: event.target.checked })}
              className="size-5 accent-brand"
            />
            Taxable
          </label>
        )}
        <p
          className={`flex min-h-11 items-center justify-end text-right text-[15px] font-semibold text-ink tabular-nums ${showTax ? "sm:mt-5" : ""}`}
        >
          <span className="sr-only">Line total </span>
          {formatCents(amount)}
        </p>
      </div>
      {(errors?.quantity || errors?.unitPrice) && (
        <p
          id={errors.quantity ? `${ids}-quantity-error` : `${ids}-unitPrice-error`}
          className={fieldErrorClass}
        >
          {errors.quantity ?? errors.unitPrice}
        </p>
      )}
    </li>
  );
}

export function LineItemsEditor({
  lines,
  onChange,
  errors,
  showTax,
  itemsError,
  priceWarning,
}: {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  errors: Record<string, LineErrors>;
  /** Há imposto no documento (a caixa "Taxable" só aparece com taxa > 0). */
  showTax: boolean;
  itemsError?: string;
  /** Aviso "linha sem preço" (o editor liga ao tentar mandar); as linhas sem preço ficam marcadas. */
  priceWarning?: string | null;
}) {
  const ids = useId();
  const warnId = priceWarning ? `${ids}-price-warning` : undefined;
  const listRef = useRef<HTMLOListElement>(null);

  function focusLine(key: string) {
    // Depois de desenhar a linha nova.
    window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLInputElement>(`[data-line-name="${key}"]`)?.focus();
    });
  }

  function addBlank() {
    const line = blankLine();
    onChange([...lines, line]);
    focusLine(line.key);
  }

  return (
    <div>
      {lines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300/80 px-4 py-8 text-center text-[15px] text-(--glass-fg-muted)">
          Add a service from your price book, or tap Add item.
        </p>
      ) : (
        <ol ref={listRef} aria-label="Items" className="grid gap-2">
          {lines.map((line, index) => (
            <LineCard
              key={line.key}
              line={line}
              index={index}
              errors={errors[line.key]}
              showTax={showTax}
              warnId={warnId}
              onChange={(next) => onChange(lines.map((l) => (l.key === line.key ? next : l)))}
              onRemove={() => onChange(lines.filter((l) => l.key !== line.key))}
            />
          ))}
        </ol>
      )}
      {itemsError && <p className={fieldErrorClass}>{itemsError}</p>}
      {priceWarning && (
        <Notice id={warnId} tone="warning" size="sm" role="alert" className="mt-2 font-semibold">
          {priceWarning}
        </Notice>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <PriceBookPicker
          disabled={lines.length >= 100}
          onPick={(item) => onChange([...lines, lineFromPriceItem(item)])}
        />
        <GlassButton
          variant="secondary"
          icon={<PlusIcon />}
          onClick={addBlank}
          disabled={lines.length >= 100}
        >
          Add item
        </GlassButton>
      </div>
    </div>
  );
}

/** Lista só de leitura (documento aprovado, pago, anulado ou no modo "ver como"). */
export function LineItemsView({
  lines,
}: {
  lines: readonly {
    name: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    taxable: boolean;
  }[];
}) {
  if (lines.length === 0) {
    return <p className="py-4 text-[15px] text-(--glass-fg-muted)">No items.</p>;
  }
  return (
    <ul aria-label="Items" className="divide-y divide-(--glass-rim)">
      {lines.map((line, index) => (
        <li key={index} className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold break-words text-ink">{line.name}</p>
            {line.description && (
              <p className="text-[13px] leading-5 break-words whitespace-pre-line text-slate-600">
                {line.description}
              </p>
            )}
            <p className="text-[13px] text-(--glass-fg-muted) tabular-nums">
              {formatQuantity(line.quantity)} × {formatCents(line.unitPriceCents)}
              {!line.taxable && " · not taxed"}
            </p>
          </div>
          <p className="shrink-0 text-[15px] font-semibold text-ink tabular-nums">
            {formatCents(lineTotalCents(line))}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Totais ao vivo. Com `onDiscountChange`/`onTaxChange`, desconto e imposto são campos; sem eles,
 * só leitura. "Estimated" porque o servidor recalcula ao salvar. Sem desconto e com imposto 0%,
 * os campos ficam atrás de "Add discount or tax" (e continuam abertos se algum tiver valor).
 */
export function TotalsPanel({
  totals,
  taxRate,
  taxRateBps,
  discount,
  onTaxChange,
  onDiscountChange,
  taxError,
  discountError,
  extra,
}: {
  totals: DocumentTotals;
  /** Texto do campo de imposto (%). */
  taxRate: string;
  /** Taxa já interpretada (para o rótulo). */
  taxRateBps: number;
  discount: string;
  onTaxChange?: (value: string) => void;
  onDiscountChange?: (value: string) => void;
  taxError?: string;
  discountError?: string;
  /** Linhas a mais no fim (pago, saldo). */
  extra?: ReactNode;
}) {
  const ids = useId();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const editable = Boolean(onTaxChange && onDiscountChange);
  // Valor que não é vazio nem zero (inclui texto inválido, para o erro aparecer no campo).
  const discountSet = discount.trim() !== "" && parseDollars(discount) !== 0;
  const taxSet = taxRate.trim() !== "" && parsePercentToBps(taxRate) !== 0;
  const showInputs =
    editable && (adjustOpen || discountSet || taxSet || Boolean(taxError || discountError));
  return (
    <div>
      {showInputs && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${ids}-discount`} className="block text-[13px] font-medium text-ink">
              Discount
            </label>
            <div className="relative mt-1.5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--glass-fg-muted)"
              >
                $
              </span>
              <input
                id={`${ids}-discount`}
                inputMode="decimal"
                value={discount}
                onChange={(event) => onDiscountChange?.(event.target.value)}
                placeholder="0.00"
                autoComplete="off"
                className={`${smallField} pl-7 tabular-nums`}
                aria-invalid={discountError ? true : undefined}
                aria-describedby={discountError ? `${ids}-discount-error` : undefined}
              />
            </div>
            {discountError && (
              <p id={`${ids}-discount-error`} className={fieldErrorClass}>
                {discountError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${ids}-tax`} className="block text-[13px] font-medium text-ink">
              Tax rate
            </label>
            <div className="relative mt-1.5">
              <input
                id={`${ids}-tax`}
                inputMode="decimal"
                value={taxRate}
                onChange={(event) => onTaxChange?.(event.target.value)}
                placeholder="0"
                autoComplete="off"
                className={`${smallField} pr-8 tabular-nums`}
                aria-invalid={taxError ? true : undefined}
                aria-describedby={taxError ? `${ids}-tax-error` : `${ids}-tax-hint`}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-(--glass-fg-muted)"
              >
                %
              </span>
            </div>
            {taxError ? (
              <p id={`${ids}-tax-error`} className={fieldErrorClass}>
                {taxError}
              </p>
            ) : (
              <p id={`${ids}-tax-hint`} className={hintClass}>
                Only on taxable lines.
              </p>
            )}
          </div>
        </div>
      )}

      <dl className={showInputs ? "mt-5 grid gap-2" : "grid gap-2"} aria-live="polite">
        <TotalRow label="Subtotal" value={formatCents(totals.subtotalCents)} />
        {totals.discountCents > 0 && (
          <TotalRow label="Discount" value={`−${formatCents(totals.discountCents)}`} />
        )}
        {(taxRateBps > 0 || totals.taxCents > 0) && (
          <TotalRow
            label={`Tax (${formatTaxRate(taxRateBps)})`}
            value={formatCents(totals.taxCents)}
          />
        )}
        <TotalRow label="Total" value={formatCents(totals.totalCents)} strong />
        {extra}
      </dl>
      {editable && !showInputs && (
        <button
          type="button"
          onClick={() => {
            setAdjustOpen(true);
            // Depois de desenhar os campos.
            window.requestAnimationFrame(() => {
              document.getElementById(`${ids}-discount`)?.focus();
            });
          }}
          className={`${textButtonClass} mt-2`}
        >
          <PlusIcon />
          Add discount or tax
        </button>
      )}
    </div>
  );
}
