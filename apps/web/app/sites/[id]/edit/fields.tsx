import type { ReactNode } from "react";
import { PlusIcon } from "./icons";
import { focusRing, labelClass, textButton } from "./ui";

/** Rótulo + campo. O <label> envolve o campo, então a associação é implícita. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}

/** Lista editável (serviços, perguntas, horários...) com adicionar e remover. */
export function ItemList<T>({
  items,
  max,
  addLabel,
  itemLabel,
  note,
  onAdd,
  onRemove,
  render,
}: {
  items: T[];
  max: number;
  addLabel: string;
  /** Nome de um item, para o botão "Remove" ter nome acessível único (ex.: "service 2"). */
  itemLabel: string;
  note?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => ReactNode;
}) {
  const full = items.length >= max;
  return (
    <div className="space-y-3">
      {note && <p className="text-[13px] leading-snug text-amber-800">{note}</p>}
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3">
          {render(item, index)}
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${itemLabel} ${index + 1}`}
            className={`${textButton} -my-1 text-red-700`}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        disabled={full}
        className={`${textButton} text-[15px] font-semibold text-brand`}
      >
        <PlusIcon className="size-4" />
        {addLabel}
        {full && <span className="font-normal">(max {max})</span>}
      </button>
    </div>
  );
}

/** Botão só com ícone: 44px no celular, 36px no computador (com mouse). */
export function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-11 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent motion-reduce:transition-none lg:size-9 ${focusRing}`}
    >
      {children}
    </button>
  );
}
