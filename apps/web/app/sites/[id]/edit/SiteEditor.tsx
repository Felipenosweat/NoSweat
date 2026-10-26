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
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { ModelResponse } from "@/lib/model-studio";
import { makeSlug } from "@/lib/slug";
import { PublishDialog, type PublishState } from "../PublishDialog";
import { AskAiPanel, type AiCredits, type ChatMessage } from "./AskAiPanel";
import { CanvasFrame, DESKTOP_QUERY, useMediaQuery, type Device } from "./CanvasFrame";
import {
  clean,
  describeIssue,
  heroIndex,
  localDraftKey,
  missingGalleryAlt,
  missingRequired,
  parseLocalDraft,
  previewSpec,
  REQUIRED_MESSAGES,
  sameSpec,
  SECTION_NAMES,
  serializeLocalDraft,
} from "./clean";
import { ContentPanel } from "./ContentPanel";
import { newSection } from "./defaults";
import {
  ArrowLeftIcon,
  CloseIcon,
  DesktopIcon,
  DocumentIcon,
  ExpandIcon,
  ExternalIcon,
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
import { focusRing, primaryButton, secondaryButton, textButton } from "./ui";

type TabId = "ai" | "content" | "style" | "sections" | "edit";
type Tab = { id: TabId; label: string };

// Computador: "Ask AI" mostra a conversa com a IA; "Edit" mostra três abas (Content, Style,
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

const OUT_OF_EDITS = "You’ve used today’s AI changes. More tomorrow.";
const GUEST_OUT_OF_EDITS = "You’ve used the free AI changes. Create a free account to keep going.";
const OUT_OF_CREDITS = "You’re out of AI credits. Get more in Plans and billing.";
const OFFLINE = "We couldn't reach our servers. Please try again.";
const CONFLICT =
  "This site was changed in another tab or device. Reload to get the latest version.";

/** Guarda a cópia local do rascunho (navegação privada ou armazenamento cheio: sem cópia). */
function writeLocalDraft(siteId: string, spec: SiteSpec) {
  try {
    window.localStorage.setItem(localDraftKey(siteId), serializeLocalDraft(spec));
  } catch {
    // Sem localStorage: o editor continua funcionando, só sem a cópia de segurança.
  }
}

function removeLocalDraft(siteId: string) {
  try {
    window.localStorage.removeItem(localDraftKey(siteId));
  } catch {
    // Sem localStorage: nada para apagar.
  }
}

/** `quiet`: salvamento automático (ao sair da aba), sem avisos; `notify: false`: sem o "Saved". */
type SaveOptions = { quiet?: boolean; notify?: boolean };

/** Omit que preserva cada variante de uma união (o Omit direto junta tudo numa só). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * Modo "modelo" (estúdio de modelos, /admin/models/[slug]/edit): o mesmo editor, mas salva e
 * pede mudanças à IA nas rotas do modelo (/api/admin/models/[slug]), sem publicar nem domínio;
 * no lugar de "Publish" fica "Approve model". `siteId` recebe o slug do modelo.
 */
export type ModelEditorMode = {
  /** Status salvo do modelo ao abrir o editor. */
  status: "draft" | "approved";
  /** Base da API do modelo: PATCH salva, POST `/ai-edit` e POST `/status`. */
  apiUrl: string;
  /** Prévia ao vivo (iframe) do modelo. */
  canvasUrl: string;
  /** Prévia da versão salva, em nova aba. */
  previewUrl: string;
  /** Volta para a lista de modelos. */
  backHref: string;
};

/** Aviso flutuante; `undo` mostra o botão "Undo" (mudança da IA, seção removida). */
type Toast = { id: number; kind: "ok" | "error"; text: string; undo?: () => void };

export function SiteEditor({
  siteId,
  initialSpec,
  status,
  pendingChanges = false,
  freeAddress,
  origin,
  hasSlug = true,
  updatedAt: initialUpdatedAt,
  hasDomain = false,
  aiEditsLeft: initialAiEditsLeft,
  aiCredits: initialAiCredits = null,
  isGuest = false,
  needsPlan = false,
  domainUrl = null,
  model = null,
  aiEnabled = true,
}: {
  siteId: string;
  initialSpec: SiteSpec;
  status: "live" | "draft";
  /** O rascunho salvo tem mudanças que ainda não estão no ar? */
  pendingChanges?: boolean;
  /** Endereço grátis (o atual, ou o que o site vai receber ao publicar). */
  freeAddress: string;
  /** Origem do site (https://nosweatfd.com): com ela, o endereço acompanha o nome digitado. */
  origin?: string;
  /** O site já tem slug (já foi publicado): o endereço não muda mais com o nome. */
  hasSlug?: boolean;
  /** `updatedAt` do site ao abrir o editor (o PATCH manda de volta para detectar conflito). */
  updatedAt?: string;
  /** O site já tem domínio próprio (o modal mostra "Manage domain"). */
  hasDomain?: boolean;
  /** Pedidos à IA que ainda cabem hoje; `null` = sem limite. */
  aiEditsLeft: number | null;
  /** Saldo de créditos da conta ao abrir (`null`: visitante ou admin, sem créditos). */
  aiCredits?: AiCredits | null;
  /** Visitante sem conta: edita e usa a IA normalmente, mas publicar exige criar a conta. */
  isGuest?: boolean;
  /** Publicar exige escolher um plano antes (o modal mostra "Plan required"). */
  needsPlan?: boolean;
  /** Domínio próprio JÁ funcionando (https://dominio.com): vira o link de compartilhar. */
  domainUrl?: string | null;
  /** Editando um site-modelo no estúdio (só admins); ver ModelEditorMode. */
  model?: ModelEditorMode | null;
  /**
   * As mudanças pela IA estão ligadas (server/ai, aiEnabled)? Sem IA (produção sem chave), o
   * pedido à IA e o "Rewrite with AI" somem, com um aviso, e o editor abre na edição.
   */
  aiEnabled?: boolean;
}) {
  // Endereços do site ou, no modo modelo, do modelo (cópia local separada por prefixo).
  const draftKey = model ? `model-${siteId}` : siteId;
  const saveUrl = model ? model.apiUrl : `/api/sites/${siteId}`;
  const aiEditUrl = model ? `${model.apiUrl}/ai-edit` : `/api/sites/${siteId}/ai-edit`;
  const previewHref = model ? model.previewUrl : `/sites/preview/${siteId}`;
  const canvasSrc = model ? model.canvasUrl : `/sites/${siteId}/edit/canvas`;
  // Visitante volta para a prévia (a página do site exige conta).
  const backHref = model
    ? model.backHref
    : isGuest
      ? `/sites/preview/${siteId}`
      : `/sites/${siteId}`;
  const [modelStatus, setModelStatus] = useState(model?.status ?? "draft");
  const [approving, setApproving] = useState(false);

  const [spec, setSpec] = useState<SiteSpec>(initialSpec);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  /** Tentou salvar sem nome/título: mostra o aviso ao lado do campo. */
  const [showRequired, setShowRequired] = useState(false);
  /** O site mudou em outra aba ou aparelho (PATCH respondeu 409). */
  const [conflict, setConflict] = useState(false);
  /** Cópia local de uma visita anterior que não foi salva (oferece restaurar). */
  const [localDraft, setLocalDraft] = useState<SiteSpec | null>(null);
  /** `updatedAt` do servidor que este editor conhece (atualizado a cada resposta). */
  const baseUpdatedAt = useRef(initialUpdatedAt);
  /** Saindo de propósito (recarregar, cadastro): sem o aviso de "mudanças não salvas". */
  const leaving = useRef(false);
  const router = useRouter();

  const [instruction, setInstruction] = useState("");
  const [aiPending, setAiPending] = useState(false);
  /** Conversa desta sessão com a IA (pedidos, resultados e erros). */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextMessageId = useRef(1);
  const [aiEditsLeft, setAiEditsLeft] = useState(initialAiEditsLeft);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(initialAiCredits?.left ?? null);
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  /** IA ligada? Começa com o que o servidor disse; um 503 `ai_unavailable` desliga. */
  const [aiOn, setAiOn] = useState(aiEnabled);
  /** Versão anterior ao último pedido à IA, para o botão "Undo". */
  const [beforeAi, setBeforeAi] = useState<SiteSpec | null>(null);
  /** Tema antes do primeiro "Shuffle style", para desfazer. */
  const [themeBeforeShuffle, setThemeBeforeShuffle] = useState<Theme | null>(null);

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  // Sem IA, abre direto na edição (no celular, "content" vira a aba "Edit").
  const [tab, setTab] = useState<TabId>(aiEnabled ? "ai" : "content");
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
  const latest = useRef({ spec, openSection, dirty, busy: false });

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
    latest.current = { spec, openSection, dirty, busy: saving || aiPending };
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

  // Avisa antes de sair da página com mudanças não salvas (o iPhone ignora este aviso: por
  // isso a cópia local e o salvamento ao trocar de app, logo abaixo).
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!leaving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Cópia local do rascunho não salvo (1 s depois da última mudança), para nada se perder se a
  // aba fechar, a conexão cair ou o iPhone descartar a página.
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => writeLocalDraft(draftKey, spec), 1_000);
    return () => window.clearTimeout(timer);
  }, [dirty, spec, draftKey]);

  // Ao abrir: se ficou uma cópia local diferente do que está salvo, oferece restaurar.
  useEffect(() => {
    let stored: SiteSpec | null = null;
    try {
      stored = parseLocalDraft(window.localStorage.getItem(localDraftKey(draftKey)));
    } catch {
      stored = null;
    }
    if (!stored) return;
    if (sameSpec(stored, initialSpec)) {
      removeLocalDraft(draftKey);
      return;
    }
    const found = stored;
    // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
    const frame = requestAnimationFrame(() => setLocalDraft(found));
    return () => cancelAnimationFrame(frame);
  }, [draftKey, initialSpec]);

  function restoreLocalDraft() {
    if (!localDraft || saving || aiPending) return;
    setSpec(localDraft);
    setDirty(true);
    setSaveError(null);
    setOpenSection(null);
    setLocalDraft(null);
    showToast({ kind: "ok", text: "Unsaved changes restored. Click “Save” to keep them." });
  }

  function discardLocalDraft() {
    removeLocalDraft(draftKey);
    setLocalDraft(null);
  }

  /** Recarrega para pegar a versão mais nova (o que não foi salvo fica na cópia local). */
  function reloadLatest() {
    if (dirty) writeLocalDraft(draftKey, spec);
    leaving.current = true;
    window.location.reload();
  }

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
    const removed = spec.sections[index];
    if (!removed || saving || aiPending) return;
    const wasOpen = openSection === index;
    update((draft) => void draft.sections.splice(index, 1));
    if (wasOpen) setOpenSection(null);
    else if (openSection !== null && openSection > index) setOpenSection(openSection - 1);

    // "Undo" põe a seção de volta no mesmo lugar (sem desfazer o que foi editado depois).
    const name = SECTION_NAMES[removed.type];
    const snapshot = structuredClone(removed);
    showToast({
      kind: "ok",
      text: `${name} section removed.`,
      undo: () => {
        const current = latest.current;
        if (current.busy || current.spec.sections.length >= 10) return;
        setSpec((draft) => {
          const next = structuredClone(draft);
          next.sections.splice(Math.min(index, next.sections.length), 0, snapshot);
          return next;
        });
        setOpenSection((open) =>
          wasOpen ? index : open !== null && open >= index ? open + 1 : open,
        );
        setDirty(true);
        setSaveError(null);
        showToast({ kind: "ok", text: `${name} section is back.` });
      },
    });
  }

  function addSection(type: SectionType) {
    if (saving || aiPending || spec.sections.length >= 10) return;
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
    if (saving || aiPending || !aiOn) return;
    say({ role: "user", text: text.trim() });
    // A IA trabalha sobre o rascunho SALVO: mudanças pendentes são salvas antes do pedido.
    let previous = spec;
    if (dirty) {
      const saved = await saveDraft({ notify: false });
      if (!saved) {
        const message =
          "Your edits couldn't be saved, so I didn't change anything yet. Check the message at the top.";
        say({ role: "assistant", kind: "error", text: message });
        if (!options.fromPrompt) showToast({ kind: "error", text: message });
        return;
      }
      previous = saved;
    }
    setAiPending(true);
    setRewritingIndex(options.sectionIndex ?? null);
    try {
      const res = await fetch(aiEditUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        if (apiError.success && apiError.data.error.code === "quota_exceeded") setAiEditsLeft(0);
        if (apiError.success && apiError.data.error.code === "out_of_credits") {
          setAiEditsLeft(0);
          setCreditsLeft(0);
        }
        if (apiError.success && apiError.data.error.code === "ai_unavailable") setAiOn(false);
        const message = apiError.success
          ? apiError.data.error.message
          : "The AI couldn't make that change.";
        say({ role: "assistant", kind: "error", text: message });
        if (!options.fromPrompt) showToast({ kind: "error", text: message });
        return;
      }
      const result = AiEditResponse.parse(body);
      if (result.updatedAt) baseUpdatedAt.current = result.updatedAt;
      setSpec(result.spec);
      setDirty(false);
      removeLocalDraft(draftKey);
      // Modelo: toda mudança salva volta para rascunho (precisa aprovar de novo).
      if (model) setModelStatus("draft");
      setBeforeAi(previous);
      setThemeBeforeShuffle(null);
      setAiEditsLeft((left) => (left === null ? null : Math.max(0, left - 1)));
      setCreditsLeft((left) =>
        left === null ? null : Math.max(0, left - (initialAiCredits?.cost ?? 0)),
      );
      // A IA salvou um rascunho novo: se o site está no ar, agora há mudanças para publicar.
      setPublishState((state) => (state === "draft" ? state : "outdated"));
      say({
        role: "assistant",
        kind: "done",
        text: result.summary,
        steps: ["Updated the site", "Saved as a draft"],
      });
      if (options.fromPrompt) setInstruction("");
      showToast({ kind: "ok", text: result.summary, undo: () => undoAiRef.current() });
      // Celular: fecha a gaveta para a pessoa ver a mudança na prévia (o "Undo" fica no aviso).
      if (!window.matchMedia(DESKTOP_QUERY).matches) closeSheet();
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

  /** Leva o dono até o campo obrigatório que falta (nome no Content, título no Hero). */
  function showMissing(missing: "name" | "headline") {
    setPanelOpen(true);
    if (missing === "name") {
      selectTab(isDesktop ? "content" : "edit");
      return;
    }
    selectTab(isDesktop ? "sections" : "edit");
    const hero = heroIndex(spec);
    if (hero >= 0) {
      scrollCanvasNext.current = true;
      scrollPanelTo.current = hero;
      setOpenSection(hero);
    }
  }

  /** Salva o rascunho. Devolve o SiteSpec salvo, ou `null` se não deu (o erro já aparece). */
  async function saveDraft({
    quiet = false,
    notify = true,
  }: SaveOptions = {}): Promise<SiteSpec | null> {
    if (saving || aiPending) return null;
    const missing = missingRequired(spec);
    if (missing) {
      if (!quiet) {
        setShowRequired(true);
        setSaveError(REQUIRED_MESSAGES[missing]);
        showMissing(missing);
      }
      return null;
    }
    const missingAlt = missingGalleryAlt(spec);
    if (missingAlt) {
      if (!quiet) setSaveError(missingAlt);
      return null;
    }
    const result = SiteSpec.safeParse(clean(spec));
    if (!result.success) {
      const issue = result.error.issues[0];
      if (!quiet) {
        setSaveError(issue ? describeIssue(issue, spec) : "Please check your changes.");
      }
      return null;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(saveUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: result.data, baseUpdatedAt: baseUpdatedAt.current }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        // Outra aba ou aparelho salvou depois: não sobrescreve; o que está aqui fica na cópia local.
        if (apiError.success && apiError.data.error.code === "conflict") {
          writeLocalDraft(draftKey, spec);
          setConflict(true);
          return null;
        }
        if (!quiet) {
          setSaveError(
            apiError.success ? apiError.data.error.message : "We couldn't save your changes.",
          );
        }
        return null;
      }
      const response = UpdateSiteResponse.parse(body);
      if (response.updatedAt) baseUpdatedAt.current = response.updatedAt;
      const saved = response.spec;
      setSpec(saved);
      setDirty(false);
      setShowRequired(false);
      removeLocalDraft(draftKey);
      if (model) setModelStatus("draft");
      setLocalDraft(null);
      setPublishState((state) => (state === "draft" ? state : "outdated"));
      // A galeria vazia saiu ao salvar: os índices mudaram, então nenhuma seção fica aberta.
      if (saved.sections.length !== spec.sections.length) setOpenSection(null);
      if (notify && !quiet) {
        showToast({
          kind: "ok",
          text: "Saved as a draft. Publish when you're ready to put it live.",
        });
      }
      return saved;
    } catch {
      if (!quiet) setSaveError(OFFLINE);
      return null;
    } finally {
      setSaving(false);
    }
  }

  /** Salva o rascunho. Devolve true se deu certo (o Publish usa para publicar só o que foi salvo). */
  async function save(options?: SaveOptions): Promise<boolean> {
    return (await saveDraft(options)) !== null;
  }

  // Publicar pelo modal: salva o que estiver pendente e publica o rascunho salvo.
  const [publishing, setPublishing] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>(
    status === "draft" ? "draft" : pendingChanges ? "outdated" : "current",
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  /** Publicou neste editor: o plano existe, o aviso "Plan required" não vale mais. */
  const [publishedHere, setPublishedHere] = useState(false);
  const [address, setAddress] = useState(freeAddress);
  /** O endereço já está definido (publicado)? Antes disso ele acompanha o nome digitado. */
  const [slugFixed, setSlugFixed] = useState(hasSlug);
  const shownAddress =
    slugFixed || !origin ? address : `${origin}/s/${makeSlug(spec.business.name, siteId)}`;
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
        const code = apiError.success ? apiError.data.error.code : null;
        // Sem plano ativo, ou o plano não comporta mais um site no ar: vai para os planos
        // (o rascunho já foi salvo acima).
        if (code === "payment_required" || code === "plan_limit") {
          const reason = code === "plan_limit" ? "&reason=plan_limit" : "";
          router.push(`/billing?site=${encodeURIComponent(siteId)}${reason}`);
          return;
        }
        setPublishError(
          apiError.success ? apiError.data.error.message : "We couldn't publish your site.",
        );
        return;
      }
      const published = PublishSiteResponse.parse(body);
      // Publicar também muda o `updatedAt`: sem isto, o próximo Save daria conflito falso.
      if (published.updatedAt) baseUpdatedAt.current = published.updatedAt;
      setAddress(published.url);
      setSlugFixed(true);
      setPublishState("current");
      setPublishedHere(true);
    } catch {
      setPublishError(OFFLINE);
    } finally {
      setPublishing(false);
    }
  }

  // ---------- Aprovar (modo modelo) ----------

  /** Aprova o modelo (salva antes o que estiver pendente) ou volta para rascunho. */
  async function setModelApproval(next: "draft" | "approved") {
    if (!model || approving || saving || aiPending) return;
    if (dirty && !(await save({ notify: false }))) return;
    setApproving(true);
    try {
      const res = await fetch(`${model.apiUrl}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        showToast({
          kind: "error",
          text: apiError.success ? apiError.data.error.message : "We couldn't update the model.",
        });
        return;
      }
      const result = ModelResponse.parse(body);
      setModelStatus(result.model.status);
      showToast({
        kind: "ok",
        text:
          result.model.status === "approved"
            ? "Model approved. New sites will start from this version within a minute."
            : "Model moved back to draft.",
      });
    } catch {
      showToast({ kind: "error", text: OFFLINE });
    } finally {
      setApproving(false);
    }
  }

  // ---------- Cadastro (visitante) ----------

  const signUpHref = `/signup?next=${encodeURIComponent(`/sites/${siteId}/edit`)}`;

  /** Antes de ir para o cadastro, salva o que estiver pendente (no iPhone o aviso não aparece). */
  function onSignUpClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!dirty) return;
    event.preventDefault();
    void (async () => {
      if (!(await save({ notify: false }))) return;
      leaving.current = true;
      router.push(signUpHref);
    })();
  }

  const canSave = dirty && !saving && !aiPending;
  const saveRef = useRef(save);
  const undoAiRef = useRef(undoAi);
  useEffect(() => {
    saveRef.current = save;
    undoAiRef.current = undoAi;
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

  // Trocou de app ou de aba com mudanças pendentes: guarda a cópia local na hora e salva.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      const current = latest.current;
      if (!current.dirty) return;
      writeLocalDraft(draftKey, current.spec);
      if (!current.busy) void saveRef.current({ quiet: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [draftKey]);

  const outOfEditsReason = isGuest ? GUEST_OUT_OF_EDITS : OUT_OF_EDITS;
  const aiCredits: AiCredits | null =
    initialAiCredits && creditsLeft !== null ? { ...initialAiCredits, left: creditsLeft } : null;
  const outOfCredits = aiCredits !== null && aiCredits.left < aiCredits.cost;
  const aiBlockedReason = outOfCredits
    ? OUT_OF_CREDITS
    : aiEditsLeft === 0
      ? outOfEditsReason
      : null;

  // ---------- Desenho ----------

  const editMode = activeTab !== "ai";
  // Mudanças ainda não salvas também contam como "não publicadas".
  const shownPublishState: PublishState =
    publishState === "current" && dirty ? "outdated" : publishState;

  /**
   * "+" do campo da IA → "Add your photos": abre a galeria (as fotos do dono). Sem galeria,
   * cria uma; com o site já no limite de seções, abre a foto do topo.
   */
  function openPhotos() {
    selectTab(isDesktop ? "sections" : "edit");
    const gallery = spec.sections.findIndex((section) => section.type === "gallery");
    if (gallery < 0 && spec.sections.length < 10 && !saving && !aiPending) {
      addSection("gallery");
      return;
    }
    const target = gallery >= 0 ? gallery : heroIndex(spec);
    if (target >= 0) {
      scrollCanvasNext.current = true;
      scrollPanelTo.current = target;
      setOpenSection(target);
    }
  }

  // Enquanto salva ou a IA trabalha, os campos ficam travados (com aviso), em vez de ignorar
  // o que a pessoa digita: a resposta do servidor substitui o SiteSpec inteiro.
  const editLocked = saving || aiPending;
  const lockable = (children: ReactNode) => (
    <>
      {editLocked && (
        <p
          role="status"
          className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-5 py-2.5 text-[13px] font-medium text-slate-600 backdrop-blur"
        >
          <span
            aria-hidden="true"
            className="size-3.5 shrink-0 rounded-full border-2 border-slate-200 border-t-brand motion-safe:animate-spin"
          />
          {aiPending ? "Working on your change…" : "Saving your changes…"}
        </p>
      )}
      <fieldset disabled={editLocked} className="m-0 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </>
  );

  const tabPanel =
    activeTab === "ai" ? (
      <AskAiPanel
        messages={messages}
        instruction={instruction}
        onInstructionChange={setInstruction}
        onSubmit={() => void runAi(instruction, { fromPrompt: true })}
        pending={aiPending}
        willSaveFirst={dirty}
        aiEditsLeft={aiEditsLeft}
        aiCredits={aiCredits}
        canUndo={beforeAi !== null}
        onUndo={undoAi}
        onAddPhotos={openPhotos}
        historyHref={isGuest || model ? null : `/sites/${siteId}`}
        isGuest={isGuest}
        aiEnabled={aiOn}
        onEditYourself={() => selectTab(isDesktop ? "content" : "edit")}
        signUpHref={isGuest ? signUpHref : null}
        onSignUp={onSignUpClick}
      />
    ) : activeTab === "style" ? (
      lockable(
        <StylePanel
          spec={spec}
          update={update}
          themeBeforeShuffle={themeBeforeShuffle}
          onShuffle={applyTheme}
          onUndoShuffle={undoShuffle}
        />,
      )
    ) : (
      lockable(
        <>
          {(activeTab === "content" || activeTab === "edit") && (
            <ContentPanel
              business={spec.business}
              update={update}
              nameError={
                showRequired && !spec.business.name.trim() ? "Add your business name." : null
              }
            />
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
                  hidden: !aiOn,
                  blockedReason: aiBlockedReason,
                  pendingIndex: rewritingIndex,
                  onRewrite: rewriteSection,
                }}
              />
            </div>
          )}
        </>,
      )
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
            href={backHref}
            title={model ? "Back to models" : isGuest ? "Back to preview" : "Back to site page"}
            onClick={(event) => {
              if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
                event.preventDefault();
              }
            }}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-ink motion-reduce:transition-none ${focusRing}`}
          >
            <ArrowLeftIcon className="size-[18px]" />
            <span className="max-sm:sr-only">
              {model ? "Models" : isGuest ? "Preview" : "Back"}
            </span>
          </Link>
          <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
          <Image
            src="/brand/nosweat-mark-64.png"
            alt=""
            width={22}
            height={22}
            className="hidden size-[22px] shrink-0 sm:block"
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
              {spec.business.name || "Your website"}
            </h1>
            {/* Celular: o estado de publicação numa linha pequena (telas maiores: à direita). */}
            <p className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4 text-slate-500 md:hidden">
              <StatusDot state={model ? modelDotState(modelStatus) : shownPublishState} />
              <span className="truncate">
                {model ? modelLabel(modelStatus) : publishLabel(shownPublishState)}
              </span>
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <EditorStatus
              saving={saving}
              dirty={dirty}
              publishState={shownPublishState}
              modelStatus={model ? modelStatus : null}
            />
            <a
              href={previewHref}
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
            {model ? (
              // Estúdio de modelos: sem publicar; aprovar faz a geração usar esta versão.
              modelStatus === "approved" && !dirty ? (
                <button
                  type="button"
                  onClick={() => void setModelApproval("draft")}
                  disabled={approving || saving || aiPending}
                  className={`${secondaryButton} lg:min-h-9`}
                >
                  {approving ? "Updating…" : "Unapprove"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void setModelApproval("approved")}
                  disabled={approving || saving || aiPending}
                  className={`${primaryButton} lg:min-h-9`}
                >
                  {approving ? (
                    "Approving…"
                  ) : (
                    <>
                      <span className="sm:hidden">Approve</span>
                      <span className="hidden sm:inline">Approve model</span>
                    </>
                  )}
                </button>
              )
            ) : isGuest ? (
              // Publicar exige conta: depois do cadastro o site passa para a conta e volta aqui.
              <Link
                href={signUpHref}
                // Com mudanças pendentes, salva antes de sair (no iPhone o aviso não aparece).
                onClick={onSignUpClick}
                className={`${primaryButton} lg:min-h-9`}
              >
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Sign up to publish</span>
              </Link>
            ) : (
              // O botão acompanha o estado: publicar, publicar as mudanças ou (em dia) compartilhar.
              // Os três abrem o mesmo modal (que tem o link para compartilhar).
              <button
                ref={publishRef}
                type="button"
                onClick={openPublish}
                aria-haspopup="dialog"
                className={`${shownPublishState === "current" ? secondaryButton : primaryButton} lg:min-h-9`}
              >
                {shownPublishState === "current" ? (
                  "Share"
                ) : (
                  <>
                    <UploadIcon className="hidden size-4 sm:block" />
                    {shownPublishState === "outdated" ? (
                      <>
                        <span className="sm:hidden">Publish</span>
                        <span className="hidden sm:inline">Publish changes</span>
                      </>
                    ) : (
                      "Publish"
                    )}
                  </>
                )}
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
                Icon={SparklesIcon}
                label="Ask AI"
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
            {/* O site tem uma página só: um rótulo, não um seletor. */}
            <span className="inline-flex h-9 items-center gap-2 px-2 text-[13px] font-medium text-slate-600">
              <DocumentIcon className="size-4 text-slate-500" />
              Home page
            </span>
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
              href={previewHref}
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

      {!isGuest && !model && (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          siteId={siteId}
          siteName={spec.business.name || "Your website"}
          state={shownPublishState}
          address={shownAddress}
          domainUrl={domainUrl}
          needsPlan={needsPlan && !publishedHere}
          onPublish={() => void publish()}
          pending={publishing || saving}
          error={publishError}
          domain={{ href: `/sites/${siteId}#domain`, samePage: false, connected: hasDomain }}
          returnFocusTo={() => publishRef.current}
        />
      )}

      {conflict && (
        <div
          role="alert"
          className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 py-1.5 pr-2 pl-4 text-[13px] font-medium text-amber-900"
        >
          <p className="py-1.5">
            {CONFLICT}
            {dirty && " Your unsaved edits stay on this device: you can restore them after."}
          </p>
          <button type="button" onClick={reloadLatest} className={`${secondaryButton} lg:min-h-9`}>
            <RefreshIcon className="size-4" />
            Reload
          </button>
        </div>
      )}

      {localDraft && !conflict && (
        <div
          role="status"
          className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 py-1.5 pr-2 pl-4 text-[13px] font-medium text-amber-900"
        >
          <p className="py-1.5">You have unsaved changes from your last visit on this device.</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={restoreLocalDraft}
              disabled={editLocked}
              className={`${secondaryButton} lg:min-h-9`}
            >
              Restore unsaved changes
            </button>
            <button
              type="button"
              onClick={discardLocalDraft}
              className={`${textButton} px-2 text-amber-900`}
            >
              Discard
            </button>
          </div>
        </div>
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
          <CanvasFrame src={canvasSrc} device={device} iframeRef={iframe} />
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
            {toast.undo && (
              <button
                type="button"
                onClick={toast.undo}
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

/** Estado do modelo no estúdio (no lugar do estado de publicação). */
function modelLabel(status: "draft" | "approved"): string {
  return status === "approved" ? "Approved model" : "Draft model";
}

function modelDotState(status: "draft" | "approved"): PublishState {
  return status === "approved" ? "current" : "outdated";
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
  modelStatus = null,
}: {
  saving: boolean;
  dirty: boolean;
  publishState: PublishState;
  /** Modo modelo: mostra o status do modelo em vez do estado de publicação. */
  modelStatus?: "draft" | "approved" | null;
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
        <StatusDot state={modelStatus ? modelDotState(modelStatus) : publishState} />
        {modelStatus ? modelLabel(modelStatus) : publishLabel(publishState)}
      </span>
    </p>
  );
}

/** Botão do seletor "Ask AI / Edit" do topo. */
function ModeButton({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof SparklesIcon;
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
