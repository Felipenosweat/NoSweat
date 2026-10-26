"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  GlassSearchField,
  GlassSegmented,
  SpinnerIcon,
  cx,
  type GlassSegmentOption,
} from "@/components/glass";
import { officeListHref } from "@/lib/office";

// Barra das listas de orçamentos e faturas: busca e filtro de status. Tudo fica na URL
// (?q=&status=): dá para voltar, recarregar e compartilhar; a página (server component) filtra.
// Sem JavaScript a busca continua funcionando como um <form> GET.

export function DocumentsToolbar<T extends string>({
  status,
  q,
  filters,
  counts,
  searchLabel,
  placeholder,
}: {
  status: T;
  q: string;
  filters: readonly { value: T; label: string }[];
  counts: Record<T, number>;
  searchLabel: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const [requestedQ, setRequestedQ] = useState(q);
  const [seenQ, setSeenQ] = useState(q);

  // A URL mudou por fora (ex.: "Clear search", voltar do navegador): o campo acompanha.
  if (q !== seenQ) {
    setSeenQ(q);
    if (q !== requestedQ) {
      setQuery(q);
      setRequestedQ(q);
    }
  }

  function go(next: { status?: T; q?: string }) {
    const href = officeListHref(pathname, {
      status: next.status ?? status,
      q: next.q ?? requestedQ,
    });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  // Busca enquanto digita (com uma pausa curta).
  useEffect(() => {
    const trimmed = query.trim().slice(0, 100);
    if (trimmed === requestedQ) return;
    const timer = window.setTimeout(() => {
      setRequestedQ(trimmed);
      const href = officeListHref(pathname, { status, q: trimmed });
      startTransition(() => router.replace(href, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, requestedQ, status, pathname, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim().slice(0, 100);
    setRequestedQ(trimmed);
    go({ q: trimmed });
  }

  const options: GlassSegmentOption<T>[] = filters.map((filter) => ({
    value: filter.value,
    label: (
      <>
        {filter.label}{" "}
        <span className="font-normal tabular-nums opacity-70">{counts[filter.value]}</span>
      </>
    ),
    ariaLabel: `${filter.label}, ${counts[filter.value]}`,
  }));

  return (
    <div className="grid gap-3" aria-busy={pending || undefined}>
      <div className="flex items-center gap-2">
        <form
          action={pathname}
          method="get"
          role="search"
          onSubmit={onSubmit}
          className="min-w-0 flex-1"
        >
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <GlassSearchField
            label={searchLabel}
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>
        <span aria-hidden="true" className={cx("size-5 shrink-0", pending ? "" : "invisible")}>
          <SpinnerIcon className="size-5 text-(--glass-fg-muted)" />
        </span>
      </div>
      {/* No celular o filtro rola de lado. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <GlassSegmented
          aria-label="Filter by status"
          options={options}
          value={status}
          onChange={(value) => go({ status: value })}
          className="min-w-max"
        />
      </div>
    </div>
  );
}
