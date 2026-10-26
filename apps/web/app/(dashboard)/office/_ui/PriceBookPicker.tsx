"use client";

import { PriceItemsResponse, type PriceItem } from "@nosweat/schema";
import Link from "next/link";
import { useState } from "react";
import {
  GlassButton,
  GlassSearchField,
  GlassSheet,
  SpinnerIcon,
  cx,
  focusRing,
} from "@/components/glass";
import { formatCents, unitLabel } from "@/lib/office";
import { ErrorNote, officeApi, toOfficeError, type OfficeApiError } from "./api";
import { BookIcon } from "./ui";

// Botão + folha "Add from price book": a tabela de preços do dono (só os itens ativos), com busca.
// Lida na primeira abertura e guardada enquanto a tela estiver aberta. Um toque acrescenta a linha.

export function PriceBookPicker({
  onPick,
  disabled,
}: {
  onPick: (item: PriceItem) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PriceItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await officeApi("/api/office/price-items", PriceItemsResponse);
      setItems(
        result.items
          .filter((item) => item.active)
          .sort((a, b) => a.name.localeCompare(b.name, "en-US", { sensitivity: "base" })),
      );
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setLoading(false);
    }
  }

  function show() {
    setQuery("");
    setOpen(true);
    // Lê na primeira abertura (e de novo se a última leitura falhou).
    if (items === null && !loading) void load();
  }

  const onClose = () => setOpen(false);

  const q = query.trim().toLowerCase();
  const shown = (items ?? []).filter(
    (item) =>
      !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  );

  return (
    <>
      <GlassButton variant="secondary" icon={<BookIcon />} onClick={show} disabled={disabled}>
        Add from price book
      </GlassButton>
      <GlassSheet
        open={open}
        onClose={onClose}
        title="Add from price book"
        description="Tap an item to add it. You can change the price on this document after."
        size="lg"
      >
        <GlassSearchField
          label="Search price book"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder="Search services and parts"
          autoComplete="off"
        />
        {error && <ErrorNote error={error} className="mt-3" />}
        {loading ? (
          <p role="status" className="flex items-center gap-2 py-8 text-[15px] text-slate-500">
            <SpinnerIcon className="size-5" /> Loading your price book…
          </p>
        ) : items && items.length === 0 ? (
          <div className="py-8 text-center text-[15px] text-slate-600">
            <p>Your price book is empty.</p>
            <Link
              href="/office/price-book"
              className={cx(
                "mt-2 inline-flex min-h-11 items-center font-semibold text-brand",
                focusRing,
              )}
            >
              Add your services and prices
            </Link>
          </div>
        ) : items && shown.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-slate-500">Nothing matches.</p>
        ) : (
          <ul className="mt-3 max-h-[55dvh] divide-y divide-(--glass-rim) overflow-y-auto">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(item);
                    setOpen(false);
                  }}
                  className={cx(
                    "flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-(--glass-ghost-hover)",
                    focusRing,
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="block truncate text-[13px] text-slate-600">
                        {item.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
                    {formatCents(item.unitPriceCents)}
                    {item.unit && (
                      <span className="block text-[12px] font-normal text-slate-500">
                        {unitLabel(item.unit)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassSheet>
    </>
  );
}
