"use client";

import {
  NearbyPlacesResponse,
  PlaceSearchResponse,
  type NearbyPlace,
  type PlaceSuggestion,
} from "@nosweat/schema";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  LIMITS,
  US_STATE_NAMES,
  matchStates,
  splitArea,
  stateCodeFor,
  toggleArea,
  type CreateFields,
} from "./brief";
import { focusRing, inputClass } from "./ui";

// Passo "Where do you work?" do /create. Ao tocar em cada campo abre um leque de opções:
// - Cidade: cidades de verdade dos EUA enquanto a pessoa digita (as maiores do estado, se o
//   campo estiver vazio). Escolher uma preenche também o estado.
// - Estado: os 50 estados e territórios pelo nome, filtrando pelo que foi digitado.
// - Área atendida: cidades vizinhas da cidade escolhida, para marcar com um toque.
// Tudo continua aceitando texto livre (cidade que não está na lista, bairros etc.).
// Listas no padrão "combobox" da WAI-ARIA: setas, Enter, Esc e leitor de tela.

type Option = { id: string; label: string; detail?: string };

type Update = <K extends keyof CreateFields>(key: K, value: CreateFields[K]) => void;

const cache = new Map<string, unknown>();

/** GET com cache na memória da aba (as mesmas buscas se repetem muito). */
async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body: unknown = await response.json();
  cache.set(url, body);
  return body;
}

export function LocationFields({
  fields,
  update,
  stateError,
}: {
  fields: Pick<CreateFields, "city" | "state" | "serviceArea">;
  update: Update;
  stateError?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-[1fr_6.5rem] gap-3 sm:grid-cols-[1fr_7.5rem]">
        <CityField city={fields.city} state={fields.state} update={update} />
        <StateField state={fields.state} update={update} error={stateError} />
      </div>
      <ServiceAreaField
        city={fields.city}
        state={fields.state}
        value={fields.serviceArea}
        update={update}
      />
    </>
  );
}

// ---------- Cidade ----------

function CityField({ city, state, update }: { city: string; state: string; update: Update }) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const validState = state.length === 2 && Boolean(US_STATE_NAMES[state]);

  // Busca enquanto a lista está aberta (pequena pausa para não buscar a cada tecla).
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: city.trim() });
    if (validState) params.set("state", state);
    const url = `/api/places?${params}`;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        try {
          const parsed = PlaceSearchResponse.safeParse(await getJson(url, controller.signal));
          if (parsed.success) setPlaces(parsed.data.places);
        } catch {
          // Sem rede ou erro: o campo continua funcionando como texto livre.
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      cache.has(url) ? 0 : 140,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, city, state, validState]);

  const options: Option[] = places.map((p) => ({
    id: `${p.name}|${p.state}`,
    label: p.name,
    // Com o estado já escolhido, todas são dele: o nome do estado seria repetição.
    detail: validState && p.state === state ? undefined : (US_STATE_NAMES[p.state] ?? p.state),
  }));

  const heading = city.trim()
    ? undefined
    : validState
      ? `Largest cities in ${US_STATE_NAMES[state]}`
      : "Largest U.S. cities";

  return (
    <Combobox
      id="create-city"
      label="City"
      value={city}
      placeholder="Worcester"
      maxLength={LIMITS.city}
      autoComplete="address-level2"
      open={open}
      setOpen={setOpen}
      options={options}
      loading={loading && options.length === 0}
      heading={heading}
      emptyText={city.trim() ? "No match. You can keep what you typed." : undefined}
      onInput={(text) => update("city", text)}
      onSelect={(option) => {
        const [name = "", code = ""] = option.id.split("|");
        update("city", name);
        update("state", code);
      }}
    />
  );
}

// ---------- Estado ----------

function StateField({ state, update, error }: { state: string; update: Update; error?: string }) {
  const [open, setOpen] = useState(false);
  // O que está escrito enquanto a lista está aberta (pode ser "mass" ou "Massachusetts").
  const [query, setQuery] = useState(state);

  const codes = matchStates(query === state ? "" : query);
  const options: Option[] = codes.map((code) => ({
    id: code,
    label: US_STATE_NAMES[code] ?? code,
    detail: code,
  }));

  return (
    <Combobox
      id="create-state"
      label="State"
      value={open ? query : state}
      placeholder="MA"
      maxLength={24}
      autoComplete="address-level1"
      open={open}
      setOpen={(next) => {
        if (next) setQuery(state);
        else {
          // Ao sair: "ma" ou "Massachusetts" viram "MA"; texto que não é estado fica como estava.
          const code = stateCodeFor(query);
          if (code && code !== state) update("state", code);
          else if (!query.trim() && state) update("state", "");
        }
        setOpen(next);
      }}
      options={options}
      selectedId={state}
      error={error}
      listClassName="right-0 w-[min(17rem,calc(100vw-2.5rem))]"
      emptyText="No state matches."
      onInput={(text) => setQuery(text)}
      onSelect={(option) => {
        setQuery(option.id);
        update("state", option.id);
      }}
    />
  );
}

// ---------- Área atendida ----------

function ServiceAreaField({
  city,
  state,
  value,
  update,
}: {
  city: string;
  state: string;
  value: string;
  update: Update;
}) {
  // Resultado guardado junto com o endereço da busca: trocar de cidade esconde a lista antiga
  // na hora, sem esperar a nova chegar.
  const [result, setResult] = useState<{ url: string; places: NearbyPlace[] }>({
    url: "",
    places: [],
  });
  const hintId = useId();
  const groupId = useId();
  const name = city.trim();
  const url =
    name && US_STATE_NAMES[state]
      ? `/api/places/nearby?${new URLSearchParams({ city: name, state })}`
      : "";

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const parsed = NearbyPlacesResponse.safeParse(await getJson(url, controller.signal));
        setResult({ url, places: parsed.success ? parsed.data.places : [] });
      } catch {
        // Sem sugestões: o campo de texto continua lá.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url]);

  const nearby = url && result.url === url ? result.places : [];
  const chosen = new Set(splitArea(value).map((n) => n.toLowerCase()));
  const chips = nearby.slice(0, 10);

  return (
    <div>
      <label htmlFor="create-serviceArea" className="block text-[13px] font-medium text-ink">
        Service area <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <input
        id="create-serviceArea"
        type="text"
        value={value}
        maxLength={LIMITS.serviceArea}
        placeholder="Shrewsbury, Auburn and Holden"
        onChange={(event) => update("serviceArea", event.target.value)}
        aria-describedby={hintId}
        className={`${inputClass(false)} h-12`}
      />
      <p id={hintId} className="mt-2 text-[13px] text-slate-500">
        Towns or neighborhoods you cover.
      </p>

      {chips.length > 0 && (
        <div role="group" aria-labelledby={groupId} className="ns-fan mt-4">
          <p id={groupId} className="text-[13px] font-medium text-ink">
            Near {city.trim()} <span className="font-normal text-slate-500">· tap to add</span>
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {chips.map((place, index) => {
              const on = chosen.has(place.name.toLowerCase());
              return (
                <li key={`${place.name}-${place.state}`} style={{ "--i": index } as CSSProperties}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => update("serviceArea", toggleArea(value, place.name))}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span aria-hidden="true" className="w-3 text-center">
                      {on ? "✓" : "+"}
                    </span>
                    {place.name}
                    <span className={on ? "text-white" : "text-slate-500"}>
                      {place.state !== state ? `${place.state} · ` : ""}
                      {place.miles} mi
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Combobox (campo com lista que abre ao tocar) ----------

function Combobox({
  id,
  label,
  value,
  placeholder,
  maxLength,
  autoComplete,
  open,
  setOpen,
  options,
  loading = false,
  heading,
  emptyText,
  selectedId,
  error,
  listClassName = "inset-x-0",
  onInput,
  onSelect,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  autoComplete: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  options: Option[];
  loading?: boolean;
  heading?: string;
  emptyText?: string;
  selectedId?: string;
  error?: string;
  listClassName?: string;
  onInput: (text: string) => void;
  onSelect: (option: Option) => void;
}) {
  const listId = `${id}-list`;
  const errorId = `${id}-error`;
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  /** Abre a lista destacando o item já escolhido (estado), se houver. */
  function openList() {
    if (open) return;
    setActive(selectedId ? options.findIndex((o) => o.id === selectedId) : -1);
    setOpen(true);
  }

  // Mantém o item destacado visível ao navegar com as setas.
  useEffect(() => {
    if (active < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(option: Option) {
    onSelect(option);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (options.length ? (i + step + options.length) % options.length : -1));
    } else if (event.key === "Enter" && open && active >= 0 && options[active]) {
      // Enter escolhe da lista (e não envia o formulário).
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && (options.length > 0 || loading || Boolean(emptyText));
  const activeId = open && active >= 0 && options[active] ? `${id}-opt-${active}` : undefined;

  let body: ReactNode;
  if (loading) {
    body = <li className="px-4 py-3 text-sm text-slate-500">Looking up places…</li>;
  } else if (options.length === 0) {
    body = <li className="px-4 py-3 text-sm text-slate-500">{emptyText}</li>;
  } else {
    body = options.map((option, index) => {
      const selected = option.id === selectedId;
      return (
        <li
          key={option.id}
          id={`${id}-opt-${index}`}
          data-index={index}
          role="option"
          aria-selected={index === active}
          // mousedown não tira o foco do campo (senão a lista fecha antes do clique).
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => choose(option)}
          onMouseMove={() => setActive(index)}
          className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] ${
            index === active ? "bg-brand/10 text-ink" : "text-ink"
          }`}
        >
          <span className={`min-w-0 truncate ${selected ? "font-semibold" : ""}`}>
            {option.label}
          </span>
          {option.detail && (
            <span className="shrink-0 text-[13px] text-slate-500">{option.detail}</span>
          )}
        </li>
      );
    });
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={false}
        onChange={(event) => {
          onInput(event.target.value);
          if (open) setActive(-1);
          else openList();
        }}
        onFocus={openList}
        onClick={openList}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`${inputClass(Boolean(error))} h-12`}
      />
      <div
        className={`ns-fan-list absolute top-full z-30 mt-2 ${listClassName} ${showList ? "" : "hidden"}`}
      >
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1.5 shadow-[0_18px_40px_-12px_rgb(7_27_51/.28)]"
        >
          {heading && options.length > 0 && !loading && (
            <li
              role="presentation"
              className="px-4 pt-1.5 pb-1 text-[12px] font-semibold tracking-wide text-slate-500 uppercase"
            >
              {heading}
            </li>
          )}
          {body}
        </ul>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
