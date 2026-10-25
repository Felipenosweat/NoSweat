"use client";

import type { ClientStage } from "@nosweat/schema";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";
import {
  GlassSearchField,
  GlassSegmented,
  SpinnerIcon,
  cx,
  focusRing,
  type GlassSegmentOption,
} from "@/components/glass";
import {
  CLIENT_SORTS,
  CLIENT_STAGES,
  SORT_LABELS,
  STAGE_LABELS,
  isClientSort,
} from "@/lib/clients";
import { clientsHref, type ClientsParams as Params, type ClientsView } from "./params";
import { BoardIcon, ListIcon } from "./ui";

// Barra de filtros da lista de clientes: busca, etapa, ordem e lista/quadro. Tudo fica na URL
// (?q=&stage=&sort=&view=&due=), então dá para voltar, recarregar e compartilhar o link; a página
// (server component) filtra. Sem JavaScript a busca continua funcionando como um <form> GET.

type StageValue = ClientStage | "all";

export function ClientsToolbar({
  params,
  counts,
  total,
}: {
  params: Params;
  /** Quantos clientes em cada etapa (com a busca aplicada). */
  counts: Record<ClientStage, number>;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ids = useId();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.q);
  // Última busca que esta barra mandou para a URL, e a última `q` da URL que ela viu.
  const [requestedQ, setRequestedQ] = useState(params.q);
  const [seenQ, setSeenQ] = useState(params.q);

  // A URL mudou por fora (ex.: "Clear search", voltar do navegador): o campo acompanha. Se foi a
  // própria barra que mandou, não mexe (a pessoa pode já ter digitado mais).
  if (params.q !== seenQ) {
    setSeenQ(params.q);
    if (params.q !== requestedQ) {
      setQuery(params.q);
      setRequestedQ(params.q);
    }
  }

  function go(next: Partial<Params>) {
    const href = clientsHref({ ...params, q: requestedQ, ...next });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  // Busca enquanto digita (com uma pausa curta).
  useEffect(() => {
    const trimmed = query.trim().slice(0, 100);
    if (trimmed === requestedQ) return;
    const timer = window.setTimeout(() => {
      setRequestedQ(trimmed);
      const href = clientsHref({ ...params, q: trimmed });
      startTransition(() => router.replace(href, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, requestedQ, params, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim().slice(0, 100);
    setRequestedQ(trimmed);
    go({ q: trimmed });
  }

  const stageOptions: GlassSegmentOption<StageValue>[] = [
    {
      value: "all",
      label: (
        <>
          All <span className="font-normal tabular-nums opacity-70">{total}</span>
        </>
      ),
      ariaLabel: `All, ${total}`,
    },
    ...CLIENT_STAGES.map((stage) => ({
      value: stage,
      label: (
        <>
          {STAGE_LABELS[stage]}{" "}
          <span className="font-normal tabular-nums opacity-70">{counts[stage]}</span>
        </>
      ),
      ariaLabel: `${STAGE_LABELS[stage]}, ${counts[stage]}`,
    })),
  ];

  const viewOptions: GlassSegmentOption<ClientsView>[] = [
    { value: "list", label: "List", icon: <ListIcon /> },
    { value: "board", label: "Board", icon: <BoardIcon /> },
  ];

  return (
    <div className="grid gap-3" aria-busy={pending || undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <form
          action={pathname}
          method="get"
          role="search"
          onSubmit={onSubmit}
          className="min-w-0 flex-1 basis-full sm:basis-64"
        >
          {/* Sem JavaScript: os outros filtros vão junto no GET. */}
          {params.stage && <input type="hidden" name="stage" value={params.stage} />}
          {params.sort !== "recent" && <input type="hidden" name="sort" value={params.sort} />}
          {params.view !== "list" && <input type="hidden" name="view" value={params.view} />}
          <GlassSearchField
            label="Search clients"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder="Search name, phone, email, tag"
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>

        <label htmlFor={`${ids}-sort`} className="sr-only">
          Sort clients
        </label>
        <div className="relative">
          <select
            id={`${ids}-sort`}
            value={params.sort}
            onChange={(event) => {
              const value = event.target.value;
              if (isClientSort(value)) go({ sort: value });
            }}
            className={cx(
              "glass glass-interactive h-11 cursor-pointer appearance-none rounded-full pr-9 pl-4 text-[15px] font-semibold text-(--glass-fg) sm:h-10",
              focusRing,
            )}
          >
            {CLIENT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-(--glass-fg-muted)"
          >
            <path d="m7 10 5 5 5-5" />
          </svg>
        </div>

        <GlassSegmented
          aria-label="Show as"
          options={viewOptions}
          value={params.view}
          onChange={(view) => go({ view })}
        />

        <span aria-hidden="true" className={cx("size-5", pending ? "" : "invisible")}>
          <SpinnerIcon className="size-5 text-(--glass-fg-muted)" />
        </span>
      </div>

      {/* O quadro já separa por etapa: o filtro só aparece na lista. No celular rola de lado. */}
      {params.view === "list" && (
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <GlassSegmented
            aria-label="Filter by stage"
            options={stageOptions}
            value={params.stage ?? "all"}
            onChange={(value) => go({ stage: value === "all" ? null : value })}
            className="min-w-max"
          />
        </div>
      )}
    </div>
  );
}
