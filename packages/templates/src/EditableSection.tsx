import type { SectionType } from "@nosweat/schema";
import type { ReactNode } from "react";

/** Nome curto de cada tipo de seção, mostrado no rótulo da seção no editor. */
export const EDITABLE_SECTION_LABELS: Record<SectionType, string> = {
  hero: "Top of page",
  services: "Services",
  testimonials: "Reviews",
  faq: "FAQ",
  contact: "Contact",
  gallery: "Gallery",
  about: "About",
};

export type EditableSectionProps = {
  index: number;
  type: SectionType;
  selected?: boolean;
  children: ReactNode;
};

/**
 * Moldura de uma seção no modo de edição (só no editor; o site publicado nunca usa isto).
 * - `data-section-index` diz ao editor qual seção foi clicada.
 * - A cor do contorno e do rótulo vem de variáveis CSS que o EDITOR define
 *   (`--ns-edit-outline` e `--ns-edit-outline-text`). Sem elas, usa as cores do tema.
 *   Nada de cor fixa do Tailwind aqui dentro.
 * - O rótulo é um <button> de verdade: alcançável pelo teclado e com nome acessível.
 */
export function EditableSection({ index, type, selected = false, children }: EditableSectionProps) {
  const label = EDITABLE_SECTION_LABELS[type];
  return (
    <div
      data-section-index={index}
      data-section-type={type}
      data-selected={selected ? "" : undefined}
      className="group/ns-edit relative cursor-pointer outline-2 -outline-offset-2 outline-transparent transition-[outline-color] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] focus-within:outline-[color:var(--ns-edit-outline,var(--ns-text))] hover:outline-[color:var(--ns-edit-outline,var(--ns-text))] data-selected:outline-[color:var(--ns-edit-outline,var(--ns-text))] motion-reduce:transition-none"
    >
      {children}
      <button
        type="button"
        data-section-select={index}
        className="absolute top-2 right-2 z-50 inline-flex min-h-8 items-center rounded-md bg-[color:var(--ns-edit-outline,var(--ns-text))] px-2.5 text-xs font-semibold text-[color:var(--ns-edit-outline-text,var(--ns-background))] opacity-0 transition-opacity duration-150 group-hover/ns-edit:opacity-100 group-data-selected/ns-edit:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-edit-outline,var(--ns-text))] motion-reduce:transition-none"
      >
        Edit {label}
      </button>
    </div>
  );
}
