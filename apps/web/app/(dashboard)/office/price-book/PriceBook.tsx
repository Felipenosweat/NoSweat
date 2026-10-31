"use client";

import { CreatePriceItemRequest, PriceItemResponse, type PriceItem } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import {
  EmptyState,
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassMenu,
  GlassSearchField,
  GlassSheet,
  SpinnerIcon,
  focusRing,
  type GlassMenuItem,
} from "@/components/glass";
import { centsToInput, formatCents, parseDollars, unitLabel } from "@/lib/office";
import { ErrorNote, officeApi, priceItemUrl, toOfficeError, type OfficeApiError } from "../_ui/api";
import {
  BookIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SlashIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../_ui/ui";
import { GuideHint } from "../../GuideHint";

// Tabela de preços (price book): os serviços e peças que o dono cobra sempre, para montar
// orçamentos e faturas em poucos toques. Lista com busca; "Add item" e "Edit" abrem a mesma folha.
// Desativar tira das sugestões sem mudar documentos antigos (nada é apagado).

type Editing = { mode: "new" } | { mode: "edit"; item: PriceItem } | null;

const UNIT_SUGGESTIONS = ["each", "hour", "visit", "sq ft", "ft"] as const;

export function PriceBook({ items, readOnly }: { items: PriceItem[]; readOnly: boolean }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [formKey, setFormKey] = useState(0);

  const q = query.trim().toLowerCase();
  const matches = (item: PriceItem) =>
    !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  const byName = (a: PriceItem, b: PriceItem) =>
    a.name.localeCompare(b.name, "en-US", { sensitivity: "base" });
  const active = items.filter((item) => item.active && matches(item)).sort(byName);
  const inactive = items.filter((item) => !item.active && matches(item)).sort(byName);

  function open(next: Exclude<Editing, null>) {
    setFormKey((key) => key + 1);
    setEditing(next);
  }

  const addButton = readOnly ? null : (
    <GlassButton variant="primary" icon={<PlusIcon />} onClick={() => open({ mode: "new" })}>
      Add item
    </GlassButton>
  );

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={<BookIcon />}
          title="Add the work you do most"
          description="Save your usual services and parts with their prices once. Then build estimates and invoices in a few taps."
          actions={addButton}
          footnote={<GuideHint section="settings" />}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <GlassSearchField
              label="Search price book"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              placeholder="Search services and parts"
              autoComplete="off"
              className="min-w-0 flex-1 basis-full sm:basis-64"
            />
            {addButton}
          </div>

          <GlassCard
            as="section"
            padding="none"
            aria-label="Price book"
            className="mt-4 overflow-hidden"
          >
            {active.length === 0 ? (
              <p className="px-5 py-8 text-center text-[15px] text-(--glass-fg-muted)">
                {q ? "Nothing matches." : "No active items."}
              </p>
            ) : (
              <ul className="divide-y divide-(--glass-rim) p-1">
                {active.map((item) => (
                  <PriceRow
                    key={item.id}
                    item={item}
                    readOnly={readOnly}
                    onEdit={() => open({ mode: "edit", item })}
                  />
                ))}
              </ul>
            )}
          </GlassCard>

          {inactive.length > 0 && (
            <section aria-labelledby="inactive-items" className="mt-8">
              <h2 id="inactive-items" className="text-[15px] font-semibold text-slate-600">
                Inactive
              </h2>
              <p className={hintClass}>
                Hidden from new estimates and invoices. Old documents keep them.
              </p>
              <GlassCard padding="none" className="mt-3 overflow-hidden">
                <ul className="divide-y divide-(--glass-rim) p-1">
                  {inactive.map((item) => (
                    <PriceRow
                      key={item.id}
                      item={item}
                      readOnly={readOnly}
                      onEdit={() => open({ mode: "edit", item })}
                    />
                  ))}
                </ul>
              </GlassCard>
            </section>
          )}
        </>
      )}

      <GlassSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Edit item" : "Add to price book"}
        size="lg"
      >
        {editing && (
          <PriceItemForm
            key={formKey}
            item={editing.mode === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </GlassSheet>
    </>
  );
}

function PriceRow({
  item,
  readOnly,
  onEdit,
}: {
  item: PriceItem;
  readOnly: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [problem, setProblem] = useState<OfficeApiError | null>(null);

  async function setActive(active: boolean) {
    setWorking(true);
    try {
      await officeApi(priceItemUrl(item.id), PriceItemResponse, {
        method: "PATCH",
        body: { active },
      });
      startRefresh(() => router.refresh());
    } catch (err) {
      setProblem(toOfficeError(err));
    } finally {
      setWorking(false);
    }
  }

  const busy = working || refreshing;
  const menu: GlassMenuItem[] = readOnly
    ? []
    : [
        { label: "Edit", icon: <PencilIcon />, onSelect: onEdit, key: "edit" },
        { type: "separator", key: "sep" },
        item.active
          ? {
              label: "Deactivate",
              icon: <SlashIcon />,
              onSelect: () => void setActive(false),
              disabled: busy,
              key: "deactivate",
            }
          : {
              label: "Reactivate",
              icon: <CheckIcon />,
              onSelect: () => void setActive(true),
              disabled: busy,
              key: "activate",
            },
      ];

  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`truncate text-[15px] leading-6 font-semibold ${item.active ? "text-ink" : "text-(--glass-fg-muted)"}`}
          >
            {item.name}
          </span>
          {!item.taxable && (
            <GlassBadge tone="neutral" size="sm" dot={false}>
              No tax
            </GlassBadge>
          )}
        </span>
        {item.description && (
          <span className="block truncate text-[13px] leading-5 text-slate-600">
            {item.description}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right tabular-nums">
        <span className="block text-[15px] font-semibold text-ink">
          {formatCents(item.unitPriceCents)}
        </span>
        {item.unit && (
          <span className="block text-[12px] text-(--glass-fg-muted)">{unitLabel(item.unit)}</span>
        )}
      </span>
    </>
  );

  return (
    <li className="flex items-center gap-1 pr-2 sm:pr-3">
      {readOnly ? (
        <div className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 pl-4 sm:pl-5">
          {content}
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className={`flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-4 text-left transition-colors duration-150 hover:bg-(--glass-ghost-hover) sm:pl-5 ${focusRing}`}
        >
          <span className="sr-only">Edit </span>
          {content}
        </button>
      )}
      {menu.length > 0 && (
        <GlassMenu
          items={menu}
          label={`More actions for ${item.name}`}
          triggerIcon={busy ? <SpinnerIcon /> : undefined}
        />
      )}
      {problem && (
        <GlassSheet
          open
          onClose={() => setProblem(null)}
          title={`Couldn't update ${item.name}`}
          description={problem.message}
          size="sm"
          footer={
            <GlassButton variant="primary" onClick={() => setProblem(null)}>
              OK
            </GlassButton>
          }
        />
      )}
    </li>
  );
}

type FormField = "name" | "description" | "price" | "unit";

function PriceItemForm({ item, onDone }: { item: PriceItem | null; onDone: () => void }) {
  const router = useRouter();
  const ids = useId();
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? centsToInput(item.unitPriceCents) : "");
  const [unit, setUnit] = useState(item?.unit ?? "each");
  const [taxable, setTaxable] = useState(item?.taxable ?? true);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const next: Partial<Record<FormField, string>> = {};
    const cents = parseDollars(price);
    if (cents === null || cents === undefined) next.price = "Enter a price like 120 or 89.50.";
    const parsed = CreatePriceItemRequest.safeParse({
      name,
      description: description.trim(),
      unitPriceCents: cents ?? 0,
      unit: unit.trim(),
      taxable,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        const field: FormField | undefined =
          key === "name"
            ? "name"
            : key === "description"
              ? "description"
              : key === "unit"
                ? "unit"
                : key === "unitPriceCents"
                  ? "price"
                  : undefined;
        if (field && !next[field]) next[field] = issue.message;
      }
    }
    if (Object.keys(next).length > 0 || !parsed.success) {
      setErrors(next);
      const first = Object.keys(next)[0] ?? "name";
      document.getElementById(`${ids}-${first}`)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await officeApi(item ? priceItemUrl(item.id) : "/api/office/price-items", PriceItemResponse, {
        method: item ? "PATCH" : "POST",
        body: parsed.data,
      });
      onDone();
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err));
      setPending(false);
    }
  }

  const errorProps = (field: FormField) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${ids}-${field}-error` }
      : {};
  const errorText = (field: FormField) =>
    errors[field] ? (
      <p id={`${ids}-${field}-error`} className={fieldErrorClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Price book item">
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor={`${ids}-name`} className={labelClass}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            autoComplete="off"
            placeholder="Drain cleaning"
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("name")}
          />
          {errorText("name")}
        </div>

        <div>
          <label htmlFor={`${ids}-description`} className={labelClass}>
            Description <span className="font-normal text-(--glass-fg-muted)">(optional)</span>
          </label>
          <textarea
            id={`${ids}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="What's included, shown to the customer"
            className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
            {...errorProps("description")}
          />
          {errorText("description")}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-price`} className={labelClass}>
              Price
            </label>
            <div className="relative mt-1.5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--glass-fg-muted)"
              >
                $
              </span>
              <input
                id={`${ids}-price`}
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                autoComplete="off"
                placeholder="0.00"
                className={`${fieldClass} h-11 pl-7 tabular-nums`}
                {...errorProps("price")}
              />
            </div>
            {errorText("price")}
          </div>
          <div>
            <label htmlFor={`${ids}-unit`} className={labelClass}>
              Per
            </label>
            <input
              id={`${ids}-unit`}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              maxLength={20}
              autoComplete="off"
              list={`${ids}-units`}
              placeholder="each"
              className={`${fieldClass} mt-1.5 h-11`}
              {...errorProps("unit")}
            />
            <datalist id={`${ids}-units`}>
              {UNIT_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            {errorText("unit")}
          </div>
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={taxable}
            onChange={(event) => setTaxable(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>
            <span className="block text-[15px] font-semibold text-ink">Charge sales tax</span>
            <span className="block text-[13px] leading-5 text-slate-600">
              Turn off for labor or anything not taxed in your state.
            </span>
          </span>
        </label>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <GlassButton variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </GlassButton>
      </div>
    </form>
  );
}
