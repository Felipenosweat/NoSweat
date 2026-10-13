"use client";

import { useId, useRef, type FormEvent, type KeyboardEvent } from "react";
import { UndoIcon } from "./icons";
import { focusRing, inputClass, panelTitle, primaryButton, secondaryButton } from "./ui";

/** Sugestões que preenchem o campo (o dono revisa antes de enviar; cada pedido conta no limite). */
const SUGGESTIONS: { label: string; text: string }[] = [
  { label: "Make it warmer", text: "Make the tone of the whole site warmer and more personal." },
  { label: "Shorter headline", text: "Make the headline at the top shorter and punchier." },
  { label: "Add a service", text: "Add a service: " },
  { label: "More professional", text: "Make the wording more professional throughout the site." },
  { label: "Friendlier FAQ", text: "Rewrite the FAQ answers to sound friendlier." },
];

export function AskAiPanel({
  instruction,
  onInstructionChange,
  onSubmit,
  pending,
  blockedReason,
  aiEditsLeft,
  lastSummary,
  canUndo,
  onUndo,
  error,
}: {
  instruction: string;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  /** Motivo para não poder pedir agora (ex.: há mudanças não salvas), ou `null`. */
  blockedReason: string | null;
  /** Pedidos que ainda cabem hoje; `null` = sem limite. */
  aiEditsLeft: number | null;
  lastSummary: string | null;
  canUndo: boolean;
  onUndo: () => void;
  error: string | null;
}) {
  const ids = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const outOfEdits = aiEditsLeft === 0;
  const locked = pending || blockedReason !== null || outOfEdits;
  const canSend = !locked && instruction.trim().length >= 3;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canSend) onSubmit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter envia; Enter sozinho continua quebrando a linha.
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(event);
  }

  function applySuggestion(text: string) {
    onInstructionChange(text);
    requestAnimationFrame(() => {
      const el = field.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }

  return (
    <div className="space-y-5 px-5 py-6">
      <div>
        <h2 className={panelTitle}>Describe a change</h2>
        <p className="mt-1 text-[13px] leading-snug text-slate-500">
          Say what to change, in your own words. Every change is saved as a draft you can undo.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={`${ids}-prompt`} className="sr-only">
          What would you like to change?
        </label>
        <textarea
          ref={field}
          id={`${ids}-prompt`}
          rows={4}
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={locked}
          maxLength={1000}
          aria-describedby={`${ids}-hint`}
          placeholder="e.g. Change my hours to Monday through Saturday, 8 AM to 6 PM."
          className={`${inputClass} mt-0 resize-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`}
        />

        <div role="group" aria-label="Suggestions" className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              disabled={locked}
              onClick={() => applySuggestion(suggestion.text)}
              className={`inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-ink disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white motion-reduce:transition-none lg:min-h-9 ${focusRing}`}
            >
              {suggestion.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p id={`${ids}-hint`} className="text-[13px] text-slate-500">
            {blockedReason ??
              (outOfEdits
                ? "You’ve used today’s AI changes. More tomorrow."
                : aiEditsLeft === null
                  ? "No daily limit on your account."
                  : `${aiEditsLeft} AI ${aiEditsLeft === 1 ? "change" : "changes"} left today`)}
          </p>
          <button type="submit" disabled={!canSend} className={`${primaryButton} shrink-0`}>
            {pending ? "Working on it…" : "Apply"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="space-y-3">
        {pending && (
          <p className="text-[13px] text-slate-600">
            Reading your site and making the change. This usually takes a few seconds.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700"
          >
            {error}
          </p>
        )}
        {lastSummary && !pending && (
          <div className="rounded-xl border border-slate-200 bg-surface p-4">
            <p className="text-[13px] font-medium text-slate-500">Last change</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{lastSummary}</p>
            <p className="mt-2 text-[13px] text-slate-500">
              Saved as a draft. Publish from your site page when you’re happy.
            </p>
            {canUndo && (
              <button type="button" onClick={onUndo} className={`${secondaryButton} mt-3`}>
                <UndoIcon className="size-4" />
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
