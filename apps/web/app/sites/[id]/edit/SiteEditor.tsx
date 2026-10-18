"use client";

import {
  AiEditResponse,
  ApiError,
  PublishSiteResponse,
  SiteSpec,
  UpdateSiteResponse,
  type Section,
  type SectionType,
  type Theme,
} from "@nosweat/schema";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { z } from "zod";
import { PublishDialog, type PublishState } from "../PublishDialog";
import { AskAiPanel, type ChatMessage } from "./AskAiPanel";
import { CanvasFrame, DESKTOP_QUERY, useMediaQuery, type Device } from "./CanvasFrame";
import { ContentPanel } from "./ContentPanel";
import { newSection } from "./defaults";
import {
  ChevronDownIcon,
  CloseIcon,
  DesktopIcon,
  DocumentIcon,
  ExpandIcon,
  ExternalIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  RefreshIcon,
  SidebarIcon,
  SparklesIcon,
  SwatchIcon,
  TabletIcon,
  UndoIcon,
  UploadIcon,
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

// Computador: "Preview" mostra a conversa com a IA; "Edit" mostra três abas (Content, Style,
// Sections). Celular: três abas na gaveta (Edit junta Content e Sections).
const EDIT_TABS: Tab[] = [
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

/** Largura do painel lateral no computador (o aviso flutuante se alinha a ela). */
const PANEL_WIDTH = "lg:w-[380px]";

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

/** Omit que preserva cada variante de uma união (o Omit direto junta tudo numa só). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type Toast = { id: number; kind: "ok" | "error"; text: string; undo?: boolean };

export function SiteEditor({
  siteId,
  initialSpec,
  status,
  pendingChanges = false,
  freeAddress,
  hasDomain = false,
  aiEditsLeft: initialAiEditsLeft,
  isGuest = false,
}: {
  siteId: string;
  initialSpec: SiteSpec;
  status: "live" | "draft";
  /** O rascunho salvo tem mudanças que ainda não estão no ar? */
  pendingChanges?: boolean;
  /** Endereço grátis (o atual, ou o que o site vai receber ao publicar). */
  freeAddress: string;
  /** O site já tem domínio próprio (o modal mostra "Manage domain"). */
  hasDomain?: boolean;
  /** Pedidos à IA que ainda cabem hoje; `null` = sem limite. */
  aiEditsLeft: number | null;
  /** Visitante sem conta: edita e usa a IA normalmente, mas publicar exige criar a conta. */
  isGuest?: boolean;
}) {
  const [spec, setSpec] = useState<SiteSpec>(initialSpec);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [instruction, setInstruction] = useState("");
  const [aiPending, setAiPending] = useState(false);
  /** Conversa desta sessão com a IA (pedidos, resultados e erros). */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextMessageId = useRef(1);
  const [aiEditsLeft, setAiEditsLeft] = useState(initialAiEditsLeft);
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  /** Versão anterior ao último pedido à IA, para o botão "Undo". */
  const [beforeAi, setBeforeAi] = useState<SiteSpec | null>(null);
  /** Tema antes do primeiro "Shuffle style", para desfazer. */
  const [themeBeforeShuffle, setThemeBeforeShuffle] = useState<Theme | null>(null);

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const [tab, setTab] = useState<TabId>("ai");
  /** Última aba de edição usada (o botão "Edit" do topo volta para ela). */
  const [editTab, setEditTab] = useState<TabId>("content");
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Painel lateral visível no computador (o botão do topo esconde para ver só a prévia). */
  const [panelOpen, setPanelOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
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
  const previewArea = useRef<HTMLElement>(null);
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

  /** Acrescenta uma mensagem à conversa com a IA. */
  function say(message: DistributiveOmit<ChatMessage, "id">) {
    const id = nextMessageId.current++;
    setMessages((current) => [...current, { ...message, id } as ChatMessage]);
  }

  function selectTab(next: TabId) {
    setTab(next);
    if (next !== "ai") setEditTab(next);
  }

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
      setEditTab(desktop ? "sections" : "edit");
      setSheetOpen(true);
      setPanelOpen(true);
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
    selectTab(next);
    setSheetOpen(true);
  }

  // ---------- Tela cheia e recarregar a prévia ----------

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    const area = previewArea.current;
    // Sem a API de tela cheia (ex.: iPhone): esconde o painel para a prévia ocupar tudo.
    if (!area || typeof area.requestFullscreen !== "function") {
      setPanelOpen((open) => !open);
      return;
    }
    area.requestFullscreen().catch(() => setPanelOpen(false));
  }

  /** Recarrega a prévia; ao carregar ela pede o rascunho de novo ("ready"). */
  function reloadPreview() {
    iframe.current?.contentWindow?.location.reload();
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

  // Avisa antes de sair da página com mudanças não salvas.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Atualiza uma cópia do SiteSpec (nunca muta o estado atual). */
  function update(change: (draft: SiteSpec) => void) {
    // Enquanto salva ou a IA trabalha, ignora edições: a resposta do servidor substitui o
    // SiteSpec inteiro e apagaria o que fosse digitado nesse meio-tempo.
    if (saving || aiPending) return;
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
    setRewritingIndex(options.sectionIndex ?? null);
    say({ role: "user", text: text.trim() });
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
        say({ role: "assistant", kind: "error", text: message });
        if (!options.fromPrompt) showToast({ kind: "error", text: message });
        return;
      }
      const result = AiEditResponse.parse(body);
      setSpec(result.spec);
      setDirty(false);
      setBeforeAi(previous);
      setThemeBeforeShuffle(null);
      setAiEditsLeft((left) => (left === null ? null : Math.max(0, left - 1)));
      // A IA salvou um rascunho novo: se o site está no ar, agora há mudanças para publicar.
      setPublishState((state) => (state === "draft" ? state : "outdated"));
      say({
        role: "assistant",
        kind: "done",
        text: result.summary,
        steps: ["Updated the site", "Saved as a draft"],
      });
      if (options.fromPrompt) setInstruction("");
      showToast({ kind: "ok", text: result.summary, undo: true });
    } catch {
      say({ role: "assistant", kind: "error", text: OFFLINE });
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
    setDirty(true);
    say({
      role: "assistant",
      kind: "note",
      text: "Change undone. Click “Save” to keep it this way.",
    });
    showToast({ kind: "ok", text: "Change undone. Click “Save” to keep it this way." });
  }

  // ---------- Salvar ----------

  /** Salva o rascunho. Devolve true se deu certo (o Publish usa para publicar só o que foi salvo). */
  async function save(): Promise<boolean> {
    const missingAlt = missingGalleryAlt(spec);
    if (missingAlt) {
      setSaveError(missingAlt);
      return false;
    }
    const result = SiteSpec.safeParse(clean(spec));
    if (!result.success) {
      const issue = result.error.issues[0];
      setSaveError(issue ? describeError(issue.path, issue.message) : "Please check your changes.");
      return false;
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
        return false;
      }
      const saved = UpdateSiteResponse.parse(body).spec;
      setSpec(saved);
      setDirty(false);
      setPublishState((state) => (state === "draft" ? state : "outdated"));
      // A galeria vazia saiu ao salvar: os índices mudaram, então nenhuma seção fica aberta.
      if (saved.sections.length !== spec.sections.length) setOpenSection(null);
      showToast({
        kind: "ok",
        text: "Saved as a draft. Publish when you're ready to put it live.",
      });
      return true;
    } catch {
      setSaveError(OFFLINE);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Publicar pelo modal: salva o que estiver pendente e publica o rascunho salvo.
  const [publishing, setPublishing] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>(
    status === "draft" ? "draft" : pendingChanges ? "outdated" : "current",
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [address, setAddress] = useState(freeAddress);
  const publishRef = useRef<HTMLButtonElement>(null);

  function openPublish() {
    setPublishError(null);
    setPublishOpen(true);
  }

  async function publish() {
    // Se o rascunho não salva, fecha o modal para o erro (barra vermelha do topo) aparecer.
    if (dirty && !(await save())) {
      setPublishOpen(false);
      return;
    }
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        // Sem plano ativo: vai escolher um (o rascunho já foi salvo acima).
        if (apiError.success && apiError.data.error.code === "payment_required") {
          window.location.assign(`/billing?site=${encodeURIComponent(siteId)}`);
          return;
        }
        setPublishError(
          apiError.success ? apiError.data.error.message : "We couldn't publish your site.",
        );
        return;
      }
      setAddress(PublishSiteResponse.parse(body).url);
      setPublishState("current");
    } catch {
      setPublishError(OFFLINE);
    } finally {
      setPublishing(false);
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

  const editMode = activeTab !== "ai";
  // Mudanças ainda não salvas também contam como "não publicadas".
  const shownPublishState: PublishState =
    publishState === "current" && dirty ? "outdated" : publishState;

  /** "+" do campo da IA → "Add your photos": abre as seções na foto do topo. */
  function openPhotos() {
    const hero = spec.sections.findIndex((section) => section.type === "hero");
    selectTab(isDesktop ? "sections" : "edit");
    if (hero >= 0) {
      scrollCanvasNext.current = true;
      scrollPanelTo.current = hero;
      setOpenSection(hero);
    }
  }

  const tabPanel =
    activeTab === "ai" ? (
      <AskAiPanel
        messages={messages}
        instruction={instruction}
        onInstructionChange={setInstruction}
        onSubmit={() => void runAi(instruction, { fromPrompt: true })}
        pending={aiPending}
        blockedReason={dirty ? UNSAVED_FOR_AI : null}
        aiEditsLeft={aiEditsLeft}
        canUndo={beforeAi !== null}
        onUndo={undoAi}
        onAddPhotos={openPhotos}
        historyHref={isGuest ? null : `/sites/${siteId}`}
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

  // Abas: no celular sempre (na gaveta); no computador só no modo "Edit".
  const hasTabs = !isDesktop || editMode;
  const labelledBy = isDesktop ? `tab-d-${activeTab}` : `tab-m-${activeTab}`;
  const toolButton = `inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-ink motion-reduce:transition-none ${focusRing}`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface text-[15px] text-ink">
      {/* ---------- Barra do topo ---------- */}
      <header className="relative z-30 shrink-0 border-b border-slate-200 bg-white">
        {/* Linha 1: marca e nome do site; estado, salvar e publicar. */}
        <div className="flex h-14 items-center gap-1.5 px-2 sm:gap-2 sm:px-3 lg:px-4">
          <Link
            // Visitante volta para a prévia (a página do site exige conta).
            href={isGuest ? `/sites/preview/${siteId}` : `/sites/${siteId}`}
            title={isGuest ? "Back to preview" : "Back to site page"}
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-slate-50 motion-reduce:transition-none ${focusRing}`}
          >
            <Image
              src="/brand/nosweat-mark-64.png"
              alt=""
              width={26}
              height={26}
              className="size-[26px]"
            />
            <span className="sr-only">{isGuest ? "Back to preview" : "Back to site page"}</span>
          </Link>
          <h1 className="min-w-0 truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
            {spec.business.name || "Your website"}
          </h1>
          {/* Celular: só a bolinha do estado de publicação (o texto aparece em telas maiores). */}
          <span className="inline-flex shrink-0 md:hidden">
            <StatusDot state={shownPublishState} />
            <span className="sr-only">{publishLabel(shownPublishState)}</span>
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <EditorStatus saving={saving} dirty={dirty} publishState={shownPublishState} />
            <a
              href={`/sites/preview/${siteId}`}
              target="_blank"
              rel="noopener"
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 motion-reduce:transition-none lg:hidden ${focusRing}`}
            >
              <ExternalIcon className="size-4" />
              <span className="sr-only">Preview saved draft (opens in a new tab)</span>
            </a>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              aria-keyshortcuts="Control+S Meta+S"
              className={`${secondaryButton} max-sm:px-3 sm:min-w-[4.5rem] lg:min-h-9`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {isGuest ? (
              // Publicar exige conta: depois do cadastro o site passa para a conta e volta aqui.
              <Link
                href={`/signup?next=${encodeURIComponent(`/sites/${siteId}/edit`)}`}
                onClick={(event) => {
                  if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
                    event.preventDefault();
                  }
                }}
                className={`${primaryButton} lg:min-h-9`}
              >
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Sign up to publish</span>
              </Link>
            ) : (
              <button
                ref={publishRef}
                type="button"
                onClick={openPublish}
                aria-haspopup="dialog"
                className={`${primaryButton} lg:min-h-9`}
              >
                <UploadIcon className="hidden size-4 sm:block" />
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Linha 2 (computador): painel, modo, página, tela cheia, aparelhos e recarregar. */}
        <div className="hidden h-12 items-center gap-3 border-t border-slate-100 px-4 lg:flex">
          <div
            className={`flex shrink-0 items-center gap-2 ${panelOpen ? "w-[calc(380px-2rem)]" : ""}`}
          >
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              aria-pressed={panelOpen}
              title={panelOpen ? "Hide side panel" : "Show side panel"}
              className={toolButton}
            >
              <SidebarIcon className="size-[18px]" />
              <span className="sr-only">Side panel</span>
            </button>
            <div
              role="group"
              aria-label="Side panel mode"
              className="inline-flex rounded-xl bg-slate-100 p-0.5"
            >
              <ModeButton
                active={!editMode}
                onClick={() => {
                  selectTab("ai");
                  setPanelOpen(true);
                }}
                Icon={EyeIcon}
                label="Preview"
              />
              <ModeButton
                active={editMode}
                onClick={() => {
                  selectTab(editTab);
                  setPanelOpen(true);
                }}
                Icon={PencilIcon}
                label="Edit"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="editor-page" className="sr-only">
              Page
            </label>
            <div className="relative">
              <DocumentIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
              <select
                id="editor-page"
                defaultValue="home"
                className={`h-9 min-w-[10rem] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-9 pl-9 text-[13px] font-medium text-ink hover:border-slate-300 ${focusRing}`}
              >
                <option value="home">Homepage</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Full screen preview"
              className={toolButton}
            >
              <ExpandIcon className="size-[18px]" />
              <span className="sr-only">Full screen preview</span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <div
              role="group"
              aria-label="Preview size"
              className="inline-flex rounded-xl bg-slate-100 p-0.5"
            >
              {DEVICES.map(({ id, label, Icon }) => {
                const active = device === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    title={label}
                    onClick={() => setChosenDevice(id)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                      active
                        ? "bg-white text-ink shadow-[0_1px_2px_rgb(7_27_51/.08)]"
                        : "text-slate-500 hover:text-ink"
                    }`}
                  >
                    <Icon className="size-[18px]" />
                    <span className="sr-only">{label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={reloadPreview}
              title="Reload preview"
              className={toolButton}
            >
              <RefreshIcon className="size-[18px]" />
              <span className="sr-only">Reload preview</span>
            </button>
            <a
              href={`/sites/preview/${siteId}`}
              target="_blank"
              rel="noopener"
              title="Open saved draft in a new tab"
              className={toolButton}
            >
              <ExternalIcon className="size-[18px]" />
              <span className="sr-only">Preview saved draft (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </header>

      {!isGuest && (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          siteId={siteId}
          siteName={spec.business.name || "Your website"}
          state={shownPublishState}
          address={address}
          onPublish={() => void publish()}
          pending={publishing || saving}
          error={publishError}
          domain={{ href: `/sites/${siteId}#domain`, samePage: false, connected: hasDomain }}
          returnFocusTo={() => publishRef.current}
        />
      )}

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
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-red-100 ${focusRing}`}
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* ---------- Painel (computador) / gaveta (celular) ---------- */}
        <aside
          ref={sheet}
          tabIndex={-1}
          aria-label="Edit your website"
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === "Escape" && !isDesktop && sheetOpen) closeSheet();
          }}
          className={`fixed inset-x-0 bottom-0 z-40 flex h-[min(80dvh,44rem)] flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-[0_-8px_24px_-8px_rgb(7_27_51/.18)] outline-none transition-[translate,visibility] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none md:max-lg:mx-auto md:max-lg:max-w-xl md:max-lg:border-x lg:visible lg:static lg:z-auto lg:h-auto ${PANEL_WIDTH} lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:transition-none ${
            sheetOpen ? "visible translate-y-0" : "invisible translate-y-full"
          } ${panelOpen ? "" : "lg:hidden"}`}
        >
          {/* Celular: alça, abas e fechar. */}
          <div className="shrink-0 lg:hidden">
            <div aria-hidden="true" className="flex justify-center pt-2">
              <span className="h-1 w-9 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center border-b border-slate-200 pr-1 pl-2">
              <TabList
                tabs={MOBILE_TABS}
                active={activeTab}
                onSelect={selectTab}
                idPrefix="tab-m"
              />
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close panel"
                className={`ml-auto flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-ink ${focusRing}`}
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>
          {/* Computador, modo "Edit": três abas. */}
          {editMode && (
            <div className="hidden shrink-0 border-b border-slate-200 px-2 lg:block">
              <TabList tabs={EDIT_TABS} active={activeTab} onSelect={selectTab} idPrefix="tab-d" />
            </div>
          )}

          <div
            key={activeTab}
            role={hasTabs ? "tabpanel" : undefined}
            id="editor-tabpanel"
            aria-labelledby={hasTabs ? labelledBy : undefined}
            className={`min-h-0 flex-1 pb-[env(safe-area-inset-bottom)] ${
              activeTab === "ai" ? "flex flex-col" : "overflow-y-auto overscroll-contain"
            }`}
          >
            {tabPanel}
          </div>
        </aside>

        {/* ---------- Prévia ---------- */}
        <main
          ref={previewArea}
          aria-label="Preview"
          className="relative flex min-w-0 flex-1 flex-col bg-surface max-lg:pb-[calc(3.5rem+max(0.625rem,env(safe-area-inset-bottom)))]"
        >
          {fullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`${secondaryButton} absolute top-4 right-4 z-10 shadow-[0_8px_24px_-8px_rgb(7_27_51/.25)]`}
            >
              <CloseIcon className="size-4" />
              Exit full screen
            </button>
          )}
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
            className={`inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-slate-500 shadow-[0_1px_2px_rgb(7_27_51/.04)] active:translate-y-px ${focusRing}`}
          >
            <SparklesIcon className="size-5 shrink-0 text-brand" />
            <span className="truncate">Ask for a change…</span>
          </button>
          <button
            type="button"
            aria-controls="editor-tabpanel"
            onClick={(event) => openSheet("edit", event.currentTarget)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            <PencilIcon className="size-5 text-slate-500" />
            Edit
          </button>
          <button
            type="button"
            aria-controls="editor-tabpanel"
            onClick={(event) => openSheet("style", event.currentTarget)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            <SwatchIcon className="size-5 text-slate-500" />
            Style
          </button>
        </div>
      </nav>

      {/* ---------- Aviso (salvo, mudança da IA com Undo, erro) ---------- */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-3 top-[4.25rem] z-50 flex justify-center lg:inset-x-auto lg:top-auto lg:bottom-6 lg:justify-start ${
          panelOpen ? "lg:left-[calc(380px+1.5rem)]" : "lg:left-6"
        }`}
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-ink py-2 pr-2 pl-4 text-[13px] text-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-12px_rgb(7_27_51/.25)] transition-[opacity,translate] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
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
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <UndoIcon className="size-4" />
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function publishLabel(state: PublishState): string {
  return state === "draft"
    ? "Not published"
    : state === "outdated"
      ? "Changes not published"
      : "Published";
}

function StatusDot({ state }: { state: PublishState | "saved" | "unsaved" | "saving" }) {
  const color =
    state === "current" || state === "saved"
      ? "bg-emerald-500"
      : state === "outdated" || state === "unsaved"
        ? "bg-amber-500"
        : "bg-slate-400";
  return <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${color}`} />;
}

/** "● Saved · ● Not published": estado do rascunho e da publicação (telas médias para cima). */
function EditorStatus({
  saving,
  dirty,
  publishState,
}: {
  saving: boolean;
  dirty: boolean;
  publishState: PublishState;
}) {
  return (
    <p
      role="status"
      className="mr-1 hidden items-center gap-3 text-[13px] whitespace-nowrap text-slate-500 md:flex"
    >
      <span className="inline-flex items-center gap-1.5">
        <StatusDot state={saving ? "saving" : dirty ? "unsaved" : "saved"} />
        <span className={dirty && !saving ? "text-slate-700" : ""}>
          {saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <StatusDot state={publishState} />
        {publishLabel(publishState)}
      </span>
    </p>
  );
}

/** Botão do seletor "Preview / Edit" do topo. */
function ModeButton({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof EyeIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
        active
          ? "bg-white text-ink shadow-[0_1px_2px_rgb(7_27_51/.08)]"
          : "text-slate-500 hover:text-ink"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
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
