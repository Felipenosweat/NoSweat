"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, CheckIcon, PlusIcon, UndoIcon } from "./icons";
import { focusRing, panelTitle } from "./ui";

// Painel "Build with No Sweat": a conversa desta sessão com a IA (pedidos e resultados) e o
// campo "Ask for a change…". A lógica do pedido (POST /api/sites/[id]/ai-edit, limite diário,
// desfazer) continua no SiteEditor; aqui só desenhamos.

/** Uma mensagem da conversa (só desta sessão; o servidor guarda as versões, não o texto). */
export type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; kind: "done"; text: string; steps: string[] }
  | { id: number; role: "assistant"; kind: "note"; text: string }
  | { id: number; role: "assistant"; kind: "error"; text: string };

/** Sugestões que preenchem o campo (o dono revisa antes de enviar; cada pedido conta no limite). */
const SUGGESTIONS: { label: string; text: string }[] = [
  { label: "Make it warmer", text: "Make the tone of the whole site warmer and more personal." },
  { label: "Shorter headline", text: "Make the headline at the top shorter and punchier." },
  { label: "Add a service", text: "Add a service: " },
  { label: "More professional", text: "Make the wording more professional throughout the site." },
  { label: "Friendlier FAQ", text: "Rewrite the FAQ answers to sound friendlier." },
];

function Mark() {
  return (
    <Image
      src="/brand/nosweat-mark-64.png"
      alt=""
      width={20}
      height={20}
      className="mt-0.5 size-5 shrink-0"
    />
  );
}

export function AskAiPanel({
  messages,
  instruction,
  onInstructionChange,
  onSubmit,
  pending,
  blockedReason,
  aiEditsLeft,
  canUndo,
  onUndo,
  onAddPhotos,
  historyHref,
}: {
  messages: ChatMessage[];
  instruction: string;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  /** Motivo para não poder pedir agora (ex.: há mudanças não salvas), ou `null`. */
  blockedReason: string | null;
  /** Pedidos que ainda cabem hoje; `null` = sem limite. */
  aiEditsLeft: number | null;
  canUndo: boolean;
  onUndo: () => void;
  /** Abre o painel de seções (onde ficam as fotos do topo e a galeria). */
  onAddPhotos: () => void;
  /** Histórico de versões (página do site); `null` para visitantes. */
  historyHref: string | null;
}) {
  const ids = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const outOfEdits = aiEditsLeft === 0;
  const locked = pending || blockedReason !== null || outOfEdits;
  const canSend = !locked && instruction.trim().length >= 3;
  const lastDoneId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.kind === "done")?.id;

  // Rola a conversa até o fim quando chega mensagem nova (ou começa um pedido).
  useEffect(() => {
    const element = log.current;
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ top: element.scrollHeight, behavior: reduce ? "instant" : "smooth" });
  }, [messages.length, pending]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canSend) onSubmit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia (como num chat); Shift+Enter quebra a linha. Cmd/Ctrl+Enter também envia.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      submit(event);
    }
  }

  function applySuggestion(text: string) {
    setMenuOpen(false);
    onInstructionChange(text);
    requestAnimationFrame(() => {
      const el = field.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }

  const hint =
    blockedReason ??
    (outOfEdits
      ? "You’ve used today’s AI changes. More tomorrow."
      : aiEditsLeft === null
        ? "Every change is saved as a draft you can undo."
        : `${aiEditsLeft} AI ${aiEditsLeft === 1 ? "change" : "changes"} left today`);

  const suggestionButton = `inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-ink disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white motion-reduce:transition-none lg:min-h-9 ${focusRing}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1">
        <h2 className={`${panelTitle} flex items-center gap-2`}>
          <Mark />
          Build with No Sweat
        </h2>
        {historyHref && (
          <a
            href={`${historyHref}#versions`}
            title="Version history"
            className={`inline-flex size-11 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink lg:size-9 ${focusRing}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8.25M3 3.75v4.5h4.5M12 7.5V12l3 2" />
            </svg>
            <span className="sr-only">Version history</span>
          </a>
        )}
      </div>

      {/* ---------- Conversa ---------- */}
      <div
        ref={log}
        role="log"
        aria-label="Conversation with No Sweat"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <div className="flex gap-2.5">
          <Mark />
          <p className="text-[15px] leading-[1.55] text-ink">
            Your site is ready. Tell me what to change, in your own words, and I&rsquo;ll update the
            draft.
          </p>
        </div>

        {messages.length === 0 && !pending && (
          <div role="group" aria-label="Suggestions" className="flex flex-wrap gap-2 pl-7.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                disabled={locked}
                onClick={() => applySuggestion(suggestion.text)}
                className={suggestionButton}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand/[0.07] px-3.5 py-2.5 text-[15px] leading-[1.5] break-words whitespace-pre-line text-ink">
                <span className="sr-only">You: </span>
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex gap-2.5">
              <Mark />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[15px] leading-[1.55] break-words ${
                    message.kind === "error" ? "font-medium text-red-700" : "text-ink"
                  }`}
                >
                  <span className="sr-only">No Sweat: </span>
                  {message.text}
                </p>
                {message.kind === "done" && (
                  <>
                    <ul className="mt-2 space-y-1">
                      {message.steps.map((step) => (
                        <li
                          key={step}
                          className="flex items-center gap-1.5 text-[13px] text-slate-500"
                        >
                          <CheckIcon className="size-3.5 text-emerald-600" />
                          {step}
                        </li>
                      ))}
                    </ul>
                    {canUndo && message.id === lastDoneId && (
                      <button
                        type="button"
                        onClick={onUndo}
                        className={`mt-1.5 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-ink lg:min-h-9 ${focusRing}`}
                      >
                        <UndoIcon className="size-4" />
                        Undo this change
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ),
        )}

        {pending && (
          <div className="flex gap-2.5" role="status">
            <Mark />
            <div>
              <p className="text-[15px] leading-[1.55] text-ink">Working on it…</p>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-slate-500">
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full border-2 border-slate-200 border-t-brand motion-safe:animate-spin"
                />
                Reading your site and making the change
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Campo do pedido ---------- */}
      <form onSubmit={submit} className="relative shrink-0 px-3 pt-1 pb-3">
        {menuOpen && (
          <div
            id={`${ids}-menu`}
            className="absolute inset-x-3 bottom-full mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgb(7_27_51/.06),0_12px_32px_-12px_rgb(7_27_51/.2)]"
          >
            <p className="px-2 pt-1 pb-2 text-[12px] font-medium text-slate-500">Quick requests</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  disabled={locked}
                  onClick={() => applySuggestion(suggestion.text)}
                  className={suggestionButton}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onAddPhotos();
              }}
              className={`mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl border-t border-slate-100 px-2 text-left text-[13px] font-medium text-ink hover:bg-slate-50 lg:min-h-10 ${focusRing}`}
            >
              <PlusIcon className="size-4 text-slate-500" />
              Add your photos
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(7_27_51/.04)] transition-[border-color,box-shadow] duration-150 focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-brand/10 motion-reduce:transition-none">
          <label htmlFor={`${ids}-prompt`} className="sr-only">
            Ask for a change
          </label>
          <textarea
            ref={field}
            id={`${ids}-prompt`}
            rows={2}
            value={instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={locked}
            maxLength={1000}
            aria-describedby={`${ids}-hint`}
            aria-keyshortcuts="Enter"
            placeholder="Ask for a change…"
            className="block max-h-40 min-h-16 w-full resize-none rounded-t-2xl bg-transparent px-3.5 pt-3 text-base leading-[1.5] text-ink [field-sizing:content] placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500 lg:text-[15px]"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls={`${ids}-menu`}
              aria-label="More options"
              className={`inline-flex size-11 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink lg:size-9 ${focusRing}`}
            >
              <PlusIcon className="size-[18px]" />
            </button>
            <button
              type="submit"
              disabled={!canSend}
              aria-label={pending ? "Working on it" : "Send"}
              className={`inline-flex size-11 items-center justify-center rounded-xl bg-brand text-white transition-colors duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 motion-reduce:transition-none lg:size-9 ${focusRing}`}
            >
              <ArrowUpIcon className="size-[18px]" />
            </button>
          </div>
        </div>
        <p id={`${ids}-hint`} className="mt-2 px-1 text-[12px] text-slate-500">
          {hint}
        </p>
      </form>
    </div>
  );
}
