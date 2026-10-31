"use client";

import type { Section, SectionType } from "@nosweat/schema";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { SECTION_LABELS } from "./defaults";
import { IconButton } from "./fields";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "./icons";
import { SectionFields } from "./SectionFields";
import { focusRing, panelTitle, secondaryButton } from "./ui";

/** O que cada tipo de seção traz, no bloco "Add a section". */
const SECTION_HINTS: Record<SectionType, string> = {
  hero: "Headline and main button",
  services: "What you offer, prices optional",
  testimonials: "Real reviews you paste in",
  faq: "Answers to common questions",
  contact: "Phone, form and map",
  gallery: "Photos you upload",
  about: "Who you are and how you work",
};

/** Limite de seções por página (o mesmo do schema). */
const MAX_SECTIONS = 10;

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
  const ids = useId();
  const [announcement, setAnnouncement] = useState("");
  const count = sections.length;
  const full = count >= MAX_SECTIONS;
  // Só os tipos que ainda não estão na página (uma galeria, um topo, um contato...).
  const present = new Set(sections.map((s) => s.type));
  const addableTypes = (Object.keys(SECTION_LABELS) as SectionType[]).filter(
    (type) => !present.has(type),
  );
  const moveButtonId = (index: number, delta: -1 | 1) =>
    `${ids}-move-${index}-${delta < 0 ? "up" : "down"}`;

  /**
   * Move e mantém o foco na MESMA seção (no novo lugar): sem isso, o foco ficaria no botão da
   * linha antiga, que agora é outra seção, e o próximo Enter moveria a seção errada.
   */
  function move(index: number, delta: -1 | 1) {
    const section = sections[index];
    if (!section) return;
    const target = index + delta;
    onMove(index, delta);
    setAnnouncement(`${SECTION_LABELS[section.type]} moved to position ${target + 1} of ${count}.`);
    requestAnimationFrame(() => {
      const same = document.getElementById(moveButtonId(target, delta));
      const other = document.getElementById(moveButtonId(target, delta < 0 ? 1 : -1));
      const button = same instanceof HTMLButtonElement && !same.disabled ? same : other;
      button?.focus();
    });
  }

  return (
    <div>
      <div className="px-5 pt-5 pb-3">
        <h2 className={panelTitle}>Sections</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Click a section in the preview, or open one here. Use the arrows to change the order.
        </p>
        <p aria-live="polite" className="sr-only">
          {announcement}
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
                  id={moveButtonId(index, -1)}
                  label={`Move ${SECTION_LABELS[section.type]} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon className="size-4" />
                </IconButton>
                <IconButton
                  id={moveButtonId(index, 1)}
                  label={`Move ${SECTION_LABELS[section.type]} down`}
                  disabled={index === count - 1}
                  onClick={() => move(index, 1)}
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

      <section aria-labelledby={`${ids}-add`} className="space-y-3 px-5 py-6">
        <h3 id={`${ids}-add`} className={panelTitle}>
          Add a section
        </h3>
        {addableTypes.length === 0 ? (
          <p className="text-[13px] text-slate-500">Every kind of section is on your page.</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {addableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={full}
                  onClick={() => onAdd(type)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white motion-reduce:transition-none ${focusRing}`}
                >
                  <PlusIcon className="size-4 shrink-0 text-brand" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-ink">
                      <span className="sr-only">Add </span>
                      {SECTION_LABELS[type]}
                    </span>
                    <span className="block text-[13px] text-slate-500">{SECTION_HINTS[type]}</span>
                  </span>
                </button>
              ))}
            </div>
            {full && (
              <p className="text-[13px] text-slate-500">
                A page can have up to {MAX_SECTIONS} sections. Remove one to add another.
              </p>
            )}
          </>
        )}
      </section>
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
