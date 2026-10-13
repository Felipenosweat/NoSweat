"use client";

import {
  AiEditResponse,
  ApiError,
  SiteSpec,
  UpdateSiteResponse,
  type Section,
  type SectionType,
  type Theme,
} from "@nosweat/schema";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { z } from "zod";
import { AskAiPanel } from "./AskAiPanel";
import { CanvasFrame, DESKTOP_QUERY, useMediaQuery, type Device } from "./CanvasFrame";
import { ContentPanel } from "./ContentPanel";
import { newSection } from "./defaults";
import {
  ArrowLeftIcon,
  CheckIcon,
  CloseIcon,
  DesktopIcon,
  ExternalIcon,
  PencilIcon,
  PhoneIcon,
  SparklesIcon,
  SwatchIcon,
  TabletIcon,
  UndoIcon,
} from "./icons";
import { CanvasMessage, postToCanvas, readMessage } from "./messages";
import {
  rewriteInstruction,
  sectionPanelId,
  SectionsPanel,
  type RewriteTone,
} from "./SectionsPanel";
import { StylePanel } from "./StylePanel";
import { focusRing, primaryButton, secondaryButton } from "./ui";

type Business = SiteSpec["business"];
type TabId = "ai" | "content" | "style" | "sections" | "edit";
type Tab = { id: TabId; label: string };

// Computador: quatro abas. Celular: três (Edit junta Content e Sections na gaveta).
const DESKTOP_TABS: Tab[] = [
  { id: "ai", label: "Ask AI" },
  { id: "content", label: "Content" },
  { id: "style", label: "Style" },
  { id: "sections", label: "Sections" },
];
const MOBILE_TABS: Tab[] = [
  { id: "ai", label: "Ask AI" },
  { id: "edit", label: "Edit" },
  { id: "style", label: "Style" },
];

const DEVICES: { id: Device; label: string; Icon: typeof DesktopIcon }[] = [
  { id: "desktop", label: "Desktop", Icon: DesktopIcon },
  { id: "tablet", label: "Tablet", Icon: TabletIcon },
  { id: "phone", label: "Phone", Icon: PhoneIcon },
];

const UNSAVED_FOR_AI = "Save your changes first, then ask the AI.";
const OUT_OF_EDITS = "You’ve used today’s AI changes. More tomorrow.";
const OFFLINE = "We couldn't reach our servers. Please try again.";

/**
 * Campos opcionais vazios saem do SiteSpec (ex.: e-mail "" não é um e-mail válido).
 * Galeria sem nenhuma foto também sai: no site ela não aparece mesmo.
 */
function clean(spec: SiteSpec): SiteSpec {
  const business: Business = { name: spec.business.name.trim() };
  const optional = ["phone", "email", "city", "state", "serviceArea"] as const;
  for (const key of optional) {
    const value = spec.business[key]?.trim();
    if (value) business[key] = key === "state" ? value.toUpperCase() : value;
  }
  const hours = (spec.business.hours ?? [])
    .map((row) => ({ days: row.days.trim(), time: row.time.trim() }))
    .filter((row) => row.days || row.time);
  if (hours.length) business.hours = hours;
  const highlights = (spec.business.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  if (highlights.length) business.highlights = highlights;
  const sections = spec.sections.filter((s) => s.type !== "gallery" || s.images.length > 0);
  return { ...spec, business, sections };
}

/**
 * Rascunho para a prévia: como `clean`, mas mantém todas as seções (o índice de cada uma
 * precisa bater com o painel) e ignora um e-mail ou estado ainda pela metade.
 * `null` se mesmo assim não for um SiteSpec válido (a prévia fica no último válido).
 */
function previewSpec(spec: SiteSpec): SiteSpec | null {
  const cleaned = clean(spec);
  const business = { ...cleaned.business };
  if (business.email && !z.email().safeParse(business.email).success) delete business.email;
  if (business.state && business.state.length !== 2) delete business.state;
  const parsed = SiteSpec.safeParse({ ...cleaned, business, sections: spec.sections });
  return parsed.success ? parsed.data : null;
}

function describeError(path: PropertyKey[], message: string): string {
  const where = path
    .map((part) => (typeof part === "number" ? `#${part + 1}` : String(part)))
    .join(" › ");
  return where ? `${where}: ${message}` : message;
}

/** A galeria exige descrição (alt) em todas as fotos; o schema aceita vazio, o editor não. */
function missingGalleryAlt(spec: SiteSpec): string | null {
  for (const [sectionIndex, section] of spec.sections.entries()) {
    if (section.type !== "gallery") continue;
    const photo = section.images.findIndex((image) => !image.alt.trim());
    if (photo >= 0) {
      return `Section #${sectionIndex + 1} (gallery): photo ${photo + 1} needs a short description.`;
    }
  }
  return null;
}

type Toast = { id: number; kind: "ok" | "error"; text: string; undo?: boolean };

export function SiteEditor({
  siteId,
  initialSpec,
  status,
  aiEditsLeft: initialAiEditsLeft,
}: {
  siteId: string;
  initialSpec: SiteSpec;
  status: "live" | "draft";
  /** Pedidos à IA que ainda cabem hoje; `null` = sem limite. */
  aiEditsLeft: number | null;
}) {
  const [spec, setSpec] = useState<SiteSpec>(initialSpec);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [instruction, setInstruction] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [aiEditsLeft, setAiEditsLeft] = useState(initialAiEditsLeft);
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  /** Versão anterior ao último pedido à IA, para o botão "Undo". */
  const [beforeAi, setBeforeAi] = useState<SiteSpec | null>(null);
  /** Tema antes do primeiro "Shuffle style", para desfazer. */
  const [themeBeforeShuffle, setThemeBeforeShuffle] = useState<Theme | null>(null);

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const [tab, setTab] = useState<TabId>("ai");
  const [sheetOpen, setSheetOpen] = useState(false);
  /** `null` = automático: computador no desktop, celular em telas pequenas. */
  const [chosenDevice, setChosenDevice] = useState<Device | null>(null);
  const device: Device = chosenDevice ?? (isDesktop ? "desktop" : "phone");
  const [openSection, setOpenSection] = useState<number | null>(null);

  const iframe = useRef<HTMLIFrameElement>(null);
  /** A próxima mudança de seção aberta deve rolar a prévia até ela? */
  const scrollCanvasNext = useRef(false);
  /** Seção cujo painel deve rolar para a vista depois do próximo desenho. */
  const scrollPanelTo = useRef<number | null>(null);
  const sheetOpener = useRef<HTMLElement | null>(null);
  const sheet = useRef<HTMLElement>(null);
  const latest = useRef({ spec, openSection });

  // As abas mudam com a largura (Edit no celular = Content + Sections no computador).
  const activeTab: TabId = isDesktop
    ? tab === "edit"
      ? "sections"
      : tab
    : tab === "content" || tab === "sections"
      ? "edit"
      : tab;

  const showToast = useCallback((next: Omit<Toast, "id">) => {
    setToast({ ...next, id: Date.now() });
  }, []);

  // ---------- Conversa com a prévia (iframe) ----------

  useEffect(() => {
    latest.current = { spec, openSection };
  });

  const sendSpec = useCallback((draft: SiteSpec) => {
    const valid = previewSpec(draft);
    if (valid) postToCanvas(iframe.current?.contentWindow, { type: "spec", spec: valid });
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = readMessage(CanvasMessage, event, iframe.current?.contentWindow);
      if (!message) return;
      if (message.type === "ready") {
        sendSpec(latest.current.spec);
        postToCanvas(iframe.current?.contentWindow, {
          type: "select",
          index: latest.current.openSection,
          scroll: false,
        });
        return;
      }
      // Clique numa seção da prévia: abre o painel dela e rola até ele.
      const desktop = window.matchMedia(DESKTOP_QUERY).matches;
      scrollPanelTo.current = message.index;
      setOpenSection(message.index);
      setTab(desktop ? "sections" : "edit");
      setSheetOpen(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendSpec]);

  // Se a prévia ainda não carregou, a mensagem se perde; o "ready" dela pede de novo.
  useEffect(() => {
    sendSpec(spec);
  }, [spec, sendSpec]);

  useEffect(() => {
    postToCanvas(iframe.current?.contentWindow, {
      type: "select",
      index: openSection,
      scroll: scrollCanvasNext.current,
    });
    scrollCanvasNext.current = false;
  }, [openSection]);

  // Depois de abrir uma seção pela prévia, mostra o painel dela no trilho/gaveta.
  useEffect(() => {
    const index = scrollPanelTo.current;
    if (index === null) return;
    scrollPanelTo.current = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(sectionPanelId(index))
      ?.scrollIntoView({ block: "start", behavior: reduce ? "instant" : "smooth" });
  });

  // ---------- Gaveta (celular) ----------

  // Ao abrir a gaveta, o foco vai para ela (Tab segue para as abas e o conteúdo).
  useEffect(() => {
    if (!sheetOpen || isDesktop) return;
    sheet.current?.focus({ preventScroll: true });
  }, [sheetOpen, isDesktop]);

  function openSheet(next: TabId, opener: HTMLElement) {
    sheetOpener.current = opener;
    setTab(next);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    sheetOpener.current?.focus();
  }

  // ---------- Avisos ----------

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.undo ? 10_000 : 6_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ---------- Edição ----------

  /** Atualiza uma cópia do SiteSpec (nunca muta o estado atual). */
  function update(change: (draft: SiteSpec) => void) {
    setSpec((current) => {
      const draft = structuredClone(current);
      change(draft);
      return draft;
    });
    setDirty(true);
    setSaveError(null);
  }

  function updateSection(index: number, change: (section: Section) => void) {
    update((draft) => {
      const section = draft.sections[index];
      if (section) change(section);
    });
  }

  function moveSection(index: number, delta: -1 | 1) {
    const target = index + delta;
    update((draft) => {
      const [section] = draft.sections.splice(index, 1);
      if (section) draft.sections.splice(target, 0, section);
    });
    // A seção aberta acompanha a mudança de lugar.
    if (openSection === index) setOpenSection(target);
    else if (openSection === target) setOpenSection(index);
  }

  function removeSection(index: number) {
    update((draft) => void draft.sections.splice(index, 1));
    if (openSection === index) setOpenSection(null);
    else if (openSection !== null && openSection > index) setOpenSection(openSection - 1);
  }

  function addSection(type: SectionType) {
    const index = spec.sections.length;
    update((draft) => void draft.sections.push(newSection(type)));
    scrollCanvasNext.current = true;
    scrollPanelTo.current = index;
    setOpenSection(index);
  }

  function toggleSection(index: number) {
    scrollCanvasNext.current = true;
    setOpenSection((current) => (current === index ? null : index));
  }

  function applyTheme(theme: Theme) {
    if (!themeBeforeShuffle) setThemeBeforeShuffle(spec.theme);
    update((draft) => void (draft.theme = { ...theme }));
  }

  function undoShuffle() {
    if (!themeBeforeShuffle) return;
    const previous = themeBeforeShuffle;
    update((draft) => void (draft.theme = { ...previous }));
    setThemeBeforeShuffle(null);
  }

  // ---------- IA ----------

  async function runAi(text: string, options: { fromPrompt: boolean; sectionIndex?: number }) {
    setAiPending(true);
    setAiError(null);
    setRewritingIndex(options.sectionIndex ?? null);
    const previous = spec;
    try {
      const res = await fetch(`/api/sites/${siteId}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        if (apiError.success && apiError.data.error.code === "quota_exceeded") setAiEditsLeft(0);
        const message = apiError.success
          ? apiError.data.error.message
          : "The AI couldn't make that change.";
        setAiError(message);
        if (!options.fromPrompt) showToast({ kind: "error", text: message });
        return;
      }
      const result = AiEditResponse.parse(body);
      setSpec(result.spec);
      setDirty(false);
      setBeforeAi(previous);
      setThemeBeforeShuffle(null);
      setLastSummary(result.summary);
      setAiEditsLeft((left) => (left === null ? null : Math.max(0, left - 1)));
      if (options.fromPrompt) setInstruction("");
      showToast({ kind: "ok", text: result.summary, undo: true });
    } catch {
      setAiError(OFFLINE);
      if (!options.fromPrompt) showToast({ kind: "error", text: OFFLINE });
    } finally {
      setAiPending(false);
      setRewritingIndex(null);
    }
  }

  function rewriteSection(index: number, tone: RewriteTone) {
    void runAi(rewriteInstruction(spec.sections, index, tone), {
      fromPrompt: false,
      sectionIndex: index,
    });
  }

  function undoAi() {
    if (!beforeAi) return;
    setSpec(beforeAi);
    setBeforeAi(null);
    setLastSummary(null);
    setDirty(true);
    showToast({ kind: "ok", text: "Change undone. Click “Save” to keep it this way." });
  }

  // ---------- Salvar ----------

  async function save() {
    const missingAlt = missingGalleryAlt(spec);
    if (missingAlt) {
      setSaveError(missingAlt);
      return;
    }
    const result = SiteSpec.safeParse(clean(spec));
    if (!result.success) {
      const issue = result.error.issues[0];
      setSaveError(issue ? describeError(issue.path, issue.message) : "Please check your changes.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: result.data }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setSaveError(
          apiError.success ? apiError.data.error.message : "We couldn't save your changes.",
        );
        return;
      }
      const saved = UpdateSiteResponse.parse(body).spec;
      setSpec(saved);
      setDirty(false);
      // A galeria vazia saiu ao salvar: os índices mudaram, então nenhuma seção fica aberta.
      if (saved.sections.length !== spec.sections.length) setOpenSection(null);
      showToast({
        kind: "ok",
        text: "Saved as a draft. Go back to your site page and publish to put it live.",
      });
    } catch {
      setSaveError(OFFLINE);
    } finally {
      setSaving(false);
    }
  }

  const canSave = dirty && !saving;
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  // Cmd/Ctrl + S salva (em vez de "salvar página" do navegador).
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSave) void saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSave]);

  const aiBlockedReason = dirty ? UNSAVED_FOR_AI : aiEditsLeft === 0 ? OUT_OF_EDITS : null;

  // ---------- Desenho ----------

  const tabPanel =
    activeTab === "ai" ? (
      <AskAiPanel
        instruction={instruction}
        onInstructionChange={setInstruction}
        onSubmit={() => void runAi(instruction, { fromPrompt: true })}
        pending={aiPending}
        blockedReason={dirty ? UNSAVED_FOR_AI : null}
        aiEditsLeft={aiEditsLeft}
        lastSummary={lastSummary}
        canUndo={beforeAi !== null}
        onUndo={undoAi}
        error={aiError}
      />
    ) : activeTab === "style" ? (
      <StylePanel
        spec={spec}
        update={update}
        themeBeforeShuffle={themeBeforeShuffle}
        onShuffle={applyTheme}
        onUndoShuffle={undoShuffle}
      />
    ) : (
      <>
        {(activeTab === "content" || activeTab === "edit") && (
          <ContentPanel business={spec.business} update={update} />
        )}
        {(activeTab === "sections" || activeTab === "edit") && (
          <div className={activeTab === "edit" ? "border-t border-slate-200" : ""}>
            <SectionsPanel
              siteId={siteId}
              sections={spec.sections}
              openSection={openSection}
              onToggle={toggleSection}
              onMove={moveSection}
              onRemove={removeSection}
              onChange={updateSection}
              onAdd={addSection}
              rewrite={{
                blockedReason: aiBlockedReason,
                pendingIndex: rewritingIndex,
                onRewrite: rewriteSection,
              }}
            />
          </div>
        )}
      </>
    );

  const labelledBy = isDesktop ? `tab-d-${activeTab}` : `tab-m-${activeTab}`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface text-[15px] text-ink">
      {/* ---------- Barra do topo ---------- */}
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4 lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <Link
            href={`/sites/${siteId}`}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-ink motion-reduce:transition-none ${focusRing}`}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only sm:not-sr-only">Back</span>
            <span className="sr-only"> to site page</span>
          </Link>
          <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" />
          <h1 className="min-w-0 truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
            {spec.business.name || "Your website"}
          </h1>
          <StatusBadge status={status} />
        </div>

        <div role="group" aria-label="Preview size" className="hidden lg:flex">
          <div className="inline-flex rounded-lg border border-slate-200 bg-surface p-0.5">
            {DEVICES.map(({ id, label, Icon }) => {
              const active = device === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  title={label}
                  onClick={() => setChosenDevice(id)}
                  className={`relative inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] motion-reduce:transition-none ${focusRing} ${
                    active
                      ? "bg-white text-ink shadow-[0_1px_2px_rgb(7_27_51/.08)] ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-ink"
                  }`}
                >
                  <Icon className="size-[18px]" />
                  <span className="sr-only xl:not-sr-only">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <SaveState saving={saving} dirty={dirty} />
          <a
            href={`/sites/preview/${siteId}`}
            target="_blank"
            rel="noopener"
            className={`${secondaryButton} max-sm:w-11 max-sm:px-0`}
          >
            <ExternalIcon className="size-4 sm:hidden" />
            <span className="sr-only sm:not-sr-only">Preview</span>
            <span className="sr-only"> saved draft (opens in a new tab)</span>
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSave}
            aria-keyshortcuts="Control+S Meta+S"
            className={`${primaryButton} min-w-[4.5rem]`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {saveError && (
        <div
          role="alert"
          className="relative z-20 flex shrink-0 items-start justify-between gap-3 border-b border-red-100 bg-red-50 py-1 pr-1 pl-4 text-[13px] font-medium text-red-700"
        >
          <p className="py-2.5">{saveError}</p>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            aria-label="Dismiss message"
            className={`flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-red-100 ${focusRing}`}
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* ---------- Trilho (computador) / gaveta (celular) ---------- */}
        <aside
          ref={sheet}
          tabIndex={-1}
          aria-label="Edit your website"
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === "Escape" && !isDesktop && sheetOpen) closeSheet();
          }}
          className={`fixed inset-x-0 bottom-0 z-40 flex outline-none md:max-lg:mx-auto md:max-lg:max-w-xl md:max-lg:border-x h-[min(80dvh,44rem)] flex-col rounded-t-xl border-t border-slate-200 bg-white shadow-[0_-8px_24px_-8px_rgb(7_27_51/.18)] transition-[translate,visibility] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none lg:visible lg:static lg:z-auto lg:h-auto lg:w-[360px] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:transition-none ${
            sheetOpen ? "visible translate-y-0" : "invisible translate-y-full"
          }`}
        >
          {/* Celular: alça, abas e fechar. */}
          <div className="shrink-0 lg:hidden">
            <div aria-hidden="true" className="flex justify-center pt-2">
              <span className="h-1 w-9 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center border-b border-slate-200 pr-1 pl-2">
              <TabList tabs={MOBILE_TABS} active={activeTab} onSelect={setTab} idPrefix="tab-m" />
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close panel"
                className={`ml-auto flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink ${focusRing}`}
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
          {/* Computador: quatro abas. */}
          <div className="hidden shrink-0 border-b border-slate-200 px-2 lg:block">
            <TabList tabs={DESKTOP_TABS} active={activeTab} onSelect={setTab} idPrefix="tab-d" />
          </div>

          <div
            key={activeTab}
            role="tabpanel"
            id="editor-tabpanel"
            aria-labelledby={labelledBy}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          >
            {tabPanel}
          </div>
        </aside>

        {/* ---------- Prévia ---------- */}
        <main
          aria-label="Preview"
          className="flex min-w-0 flex-1 flex-col max-lg:pb-[calc(3.5rem+max(0.625rem,env(safe-area-inset-bottom)))]"
        >
          <CanvasFrame src={`/sites/${siteId}/edit/canvas`} device={device} iframeRef={iframe} />
        </main>
      </div>

      {/* ---------- Barra de baixo (celular) ---------- */}
      <nav
        aria-label="Editor"
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden ${
          sheetOpen ? "invisible" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-controls="editor-tabpanel"
            onClick={(event) => openSheet("ai", event.currentTarget)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-ink shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)] active:translate-y-px ${focusRing}`}
          >
            <SparklesIcon className="size-5 text-brand" />
            Ask AI
          </button>
          <button
            type="button"
            aria-controls="editor-tabpanel"
            onClick={(event) => openSheet("edit", event.currentTarget)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            <PencilIcon className="size-5 text-slate-500" />
            Edit
          </button>
          <button
            type="button"
            aria-controls="editor-tabpanel"
            onClick={(event) => openSheet("style", event.currentTarget)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            <SwatchIcon className="size-5 text-slate-500" />
            Style
          </button>
        </div>
      </nav>

      {/* ---------- Aviso (salvo, mudança da IA com Undo, erro) ---------- */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-[4.25rem] z-50 flex justify-center lg:inset-x-auto lg:top-auto lg:bottom-6 lg:left-[calc(360px+1.5rem)] lg:justify-start"
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl bg-ink py-2 pr-2 pl-4 text-[13px] text-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-12px_rgb(7_27_51/.25)] transition-[opacity,translate] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className={`mt-3.5 size-1.5 shrink-0 rounded-full ${
                toast.kind === "error" ? "bg-red-400" : "bg-accent"
              }`}
            />
            <p className="min-w-0 flex-1 py-2.5 leading-snug">{toast.text}</p>
            {toast.undo && beforeAi && (
              <button
                type="button"
                onClick={() => {
                  undoAi();
                }}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <UndoIcon className="size-4" />
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "live" | "draft" }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 text-[12px] font-medium text-ink ring-1 ring-slate-200">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${status === "live" ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {status === "live" ? "Live" : "Draft"}
    </span>
  );
}

function SaveState({ saving, dirty }: { saving: boolean; dirty: boolean }) {
  return (
    <p
      role="status"
      className="hidden items-center gap-1.5 text-[13px] whitespace-nowrap text-slate-500 md:flex"
    >
      {saving ? (
        "Saving…"
      ) : dirty ? (
        <>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
          <span className="text-slate-700">Unsaved changes</span>
        </>
      ) : (
        <>
          <CheckIcon className="size-3.5" />
          Saved
        </>
      )}
    </p>
  );
}

/** Abas acessíveis: setas, Home e End trocam de aba (padrão WAI-ARIA, ativação automática). */
function TabList({
  tabs,
  active,
  onSelect,
  idPrefix,
}: {
  tabs: Tab[];
  active: TabId;
  onSelect: (id: TabId) => void;
  idPrefix: string;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.id === active);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onSelect(tab.id);
    document.getElementById(`${idPrefix}-${tab.id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label="Editor panels" onKeyDown={onKeyDown} className="flex">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="editor-tabpanel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            className={`relative inline-flex h-12 items-center px-3 text-[15px] font-medium transition-colors duration-150 after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand ${
              selected
                ? "text-ink after:bg-ink"
                : "text-slate-500 after:bg-transparent hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
