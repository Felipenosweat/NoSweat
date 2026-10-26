"use client";

import type { Section, SectionType } from "@nosweat/schema";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { SECTION_LABELS } from "./defaults";
import { Field, IconButton } from "./fields";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, SparklesIcon, TrashIcon } from "./icons";
import { SectionFields } from "./SectionFields";
import { focusRing, inputClass, panelTitle, secondaryButton } from "./ui";

export type RewriteTone = "friendlier" | "shorter" | "professional";

const REWRITE_TONES: { id: RewriteTone; label: string; hint: string; phrase: string }[] = [
  {
    id: "friendlier",
    label: "Friendlier",
    hint: "Warmer and more personal",
    phrase: "to be friendlier",
  },
  { id: "shorter", label: "Shorter", hint: "Fewer words, same meaning", phrase: "to be shorter" },
  {
    id: "professional",
    label: "More professional",
    hint: "Polished and confident",
    phrase: "to sound more professional",
  },
];

/** Nome da seção dentro do pedido à IA. */
const SECTION_NAMES: Record<SectionType, string> = {
  hero: "hero (top of the page)",
  services: "Services",
  testimonials: "Reviews",
  faq: "FAQ",
  contact: "Contact",
  gallery: "Gallery",
  about: "About",
};

/**
 * Seções que podem ser reescritas pela IA. Avaliações ficam de fora: são palavras de clientes
 * reais e reescrevê-las seria inventar depoimento. Contato e galeria não têm texto para reescrever.
 */
const REWRITABLE: ReadonlySet<SectionType> = new Set(["hero", "services", "faq"]);

/** Pedido à IA que mexe só numa seção (usa a mesma rota de "Ask AI"). */
export function rewriteInstruction(sections: Section[], index: number, tone: RewriteTone): string {
  const section = sections[index];
  const phrase = REWRITE_TONES.find((t) => t.id === tone)?.phrase ?? "to be friendlier";
  if (!section) return "";
  const sameType = sections.filter((s) => s.type === section.type).length;
  const where = sameType > 1 ? ` (section ${index + 1} of ${sections.length})` : "";
  return `Rewrite only the ${SECTION_NAMES[section.type]} section${where} ${phrase}; keep everything else unchanged.`;
}

/** Uma linha curta sob o título da seção, para achar a certa sem abrir. */
function sectionSummary(section: Section): string {
  const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (section.type) {
    case "hero":
      return section.title || "No headline yet";
    case "services":
      return count(section.items.length, "service");
    case "testimonials":
      return count(section.items.length, "review");
    case "faq":
      return count(section.items.length, "question");
    case "contact":
      return section.showForm ? "Form" : "Details only";
    case "gallery":
      return count(section.images.length, "photo");
    case "about":
      return section.title?.trim() || section.body.slice(0, 60) || "About";
  }
}

export const sectionPanelId = (index: number) => `section-panel-${index}`;

export function SectionsPanel({
  siteId,
  sections,
  openSection,
  onToggle,
  onMove,
  onRemove,
  onChange,
  onAdd,
  rewrite,
}: {
  siteId: string;
  sections: Section[];
  openSection: number | null;
  onToggle: (index: number) => void;
  onMove: (index: number, delta: -1 | 1) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, change: (section: Section) => void) => void;
  onAdd: (type: SectionType) => void;
  rewrite: {
    /** IA desligada (produção sem chave): o "Rewrite with AI" nem aparece. */
    hidden?: boolean;
    /** Motivo para não poder pedir agora (ex.: há mudanças não salvas), ou `null`. */
    blockedReason: string | null;
    pendingIndex: number | null;
    onRewrite: (index: number, tone: RewriteTone) => void;
  };
}) {
  const [newType, setNewType] = useState<SectionType>("faq");
  const count = sections.length;
  // Uma galeria por página: com uma já adicionada, a opção some da lista.
  const hasGallery = sections.some((s) => s.type === "gallery");
  const addableTypes = (Object.keys(SECTION_LABELS) as SectionType[]).filter(
    (type) => type !== "gallery" || !hasGallery,
  );
  const typeToAdd = addableTypes.includes(newType) ? newType : (addableTypes[0] ?? "faq");

  return (
    <div>
      <div className="px-5 pt-5 pb-3">
        <h2 className={panelTitle}>Sections</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Click a section in the preview, or open one here.
        </p>
      </div>
      <ol className="border-t border-slate-200">
        {sections.map((section, index) => {
          const open = openSection === index;
          const bodyId = `${sectionPanelId(index)}-body`;
          return (
            <li
              key={index}
              id={sectionPanelId(index)}
              className={`scroll-mt-2 border-b border-slate-200 ${open ? "bg-white" : ""}`}
            >
              <div className="flex items-center gap-1 pr-3">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  onClick={() => onToggle(index)}
                  className={`group flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-5 text-left hover:bg-slate-50 ${focusRing} focus-visible:-outline-offset-2`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                      open ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {SECTION_LABELS[section.type]}
                    </span>
                    <span className="block truncate text-[13px] text-slate-500">
                      {sectionSummary(section)}
                    </span>
                  </span>
                </button>
                <IconButton
                  label={`Move ${SECTION_LABELS[section.type]} up`}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                >
                  <ArrowUpIcon className="size-4" />
                </IconButton>
                <IconButton
                  label={`Move ${SECTION_LABELS[section.type]} down`}
                  disabled={index === count - 1}
                  onClick={() => onMove(index, 1)}
                >
                  <ArrowDownIcon className="size-4" />
                </IconButton>
                <IconButton
                  label={`Remove ${SECTION_LABELS[section.type]}`}
                  disabled={count <= 2}
                  onClick={() => onRemove(index)}
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
              {open && (
                <div id={bodyId} className="space-y-4 px-5 pt-1 pb-6">
                  {REWRITABLE.has(section.type) && !rewrite.hidden && (
                    <RewriteMenu
                      sectionLabel={SECTION_LABELS[section.type]}
                      blockedReason={rewrite.blockedReason}
                      pending={rewrite.pendingIndex === index}
                      onPick={(tone) => rewrite.onRewrite(index, tone)}
                    />
                  )}
                  <SectionFields
                    siteId={siteId}
                    section={section}
                    onChange={(change) => onChange(index, change)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="space-y-3 px-5 py-6">
        <h3 className={panelTitle}>Add a section</h3>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Field label="Section type">
              <select
                className={inputClass}
                value={typeToAdd}
                onChange={(e) => {
                  const type = addableTypes.find((t) => t === e.target.value);
                  if (type) setNewType(type);
                }}
              >
                {addableTypes.map((type) => (
                  <option key={type} value={type}>
                    {SECTION_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="button"
            disabled={count >= 10}
            onClick={() => onAdd(typeToAdd)}
            className={`${secondaryButton} shrink-0`}
          >
            Add
          </button>
        </div>
        {count >= 10 && (
          <p className="text-[13px] text-slate-500">A page can have up to 10 sections.</p>
        )}
      </div>
    </div>
  );
}

/** Menu "Rewrite" de uma seção: três tons, cada um vira um pedido à IA só para esta seção. */
function RewriteMenu({
  sectionLabel,
  blockedReason,
  pending,
  onPick,
}: {
  sectionLabel: string;
  blockedReason: string | null;
  pending: boolean;
  onPick: (tone: RewriteTone) => void;
}) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const disabled = pending || blockedReason !== null;

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const current = items.findIndex((item) => item === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      // Fecha só o menu (não a gaveta do celular em volta).
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${ids}-menu`}
        aria-describedby={blockedReason ? `${ids}-why` : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={secondaryButton}
      >
        <SparklesIcon className="size-4 text-brand" />
        {pending ? "Rewriting…" : "Rewrite with AI"}
        <ChevronDownIcon className="size-4 text-slate-500" />
      </button>
      {blockedReason && (
        <p id={`${ids}-why`} className="mt-1.5 text-[13px] text-slate-500">
          {blockedReason}
        </p>
      )}
      {open && (
        <div
          ref={menu}
          id={`${ids}-menu`}
          role="menu"
          aria-label={`Rewrite ${sectionLabel}`}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full left-0 z-20 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)]"
        >
          {REWRITE_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(tone.id);
              }}
              className="flex min-h-11 w-full flex-col justify-center rounded-lg px-3 py-1.5 text-left hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            >
              <span className="text-[15px] font-medium text-ink">{tone.label}</span>
              <span className="text-[13px] text-slate-500">{tone.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
