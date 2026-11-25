"use client";

import {
  ApiError,
  ASSISTANT_MAX_CHARS,
  AssistantChatResponse,
  type AssistantChatRequest,
} from "@nosweat/schema";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

// Painel da conversa com o atendente de IA (baixado só ao abrir; ver AssistantLauncher). A
// conversa vive só neste componente: fechar descarta tudo e abrir de novo começa outra.

type Bubble = {
  id: number;
  from: "visitor" | "assistant";
  text: string;
  offerBooking?: boolean;
  leadSaved?: boolean;
  error?: boolean;
};

let nextBubble = 0;
const bubble = (from: Bubble["from"], text: string, extra: Partial<Bubble> = {}): Bubble => ({
  id: ++nextBubble,
  from,
  text,
  ...extra,
});

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary";

export default function AssistantChat({
  id,
  siteId,
  businessName,
  onClose,
}: {
  id: string;
  siteId: string;
  businessName: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [bubbles, setBubbles] = useState<Bubble[]>(() => [
    bubble(
      "assistant",
      `Hi! I'm the AI assistant for ${businessName}. Ask me about services, prices, hours or how to get in touch.`,
    ),
  ]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [ended, setEnded] = useState(false);
  const conversationId = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Abre com o foco no campo; Esc fecha (de qualquer lugar da página).
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A mensagem nova sempre à vista.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [bubbles, pending]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || pending || ended) return;
    setDraft("");
    setPending(true);
    setBubbles((current) => [...current, bubble("visitor", message)]);
    try {
      const body: AssistantChatRequest = {
        message,
        ...(conversationId.current ? { conversationId: conversationId.current } : {}),
      };
      const res = await fetch(`/api/public/sites/${siteId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await res.json().catch(() => null);
      const parsed = res.ok ? AssistantChatResponse.safeParse(json) : null;
      if (!parsed || !parsed.success) {
        const error = ApiError.safeParse(json);
        setBubbles((current) => [
          ...current,
          bubble(
            "assistant",
            error.success
              ? error.data.error.message
              : "Sorry, something went wrong. Please try again.",
            { error: true },
          ),
        ]);
        // Conversa que o servidor não reconhece mais: só fechando e abrindo de novo.
        if (res.status === 404) setEnded(true);
        else setDraft(message);
        return;
      }
      const data = parsed.data;
      conversationId.current = data.conversationId;
      setBubbles((current) => [
        ...current,
        bubble("assistant", data.reply, {
          offerBooking: data.offerBooking,
          leadSaved: data.leadSaved,
        }),
      ]);
      if (data.ended) setEnded(true);
    } catch {
      setBubbles((current) => [
        ...current,
        bubble("assistant", "We couldn't reach the chat. Check your connection and try again.", {
          error: true,
        }),
      ]);
      setDraft(message);
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onInputKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra a linha.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  const left = ASSISTANT_MAX_CHARS - draft.length;

  return (
    <section
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ns-background text-ns-text motion-safe:animate-[glass-sheet-in_200ms_cubic-bezier(0.2,0.8,0.2,1)_both] sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(36rem,calc(100dvh-3rem))] sm:w-[23rem] sm:rounded-2xl sm:border sm:border-ns-border sm:shadow-[0_24px_60px_-18px_rgb(0_0_0/0.4),0_2px_8px_rgb(0_0_0/0.08)]"
    >
      <header className="flex items-center gap-3 border-b border-ns-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ns-primary text-sm font-semibold text-ns-on-primary"
        >
          {businessName.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate text-[15px] leading-5 font-semibold">
            {businessName}
          </h2>
          <p className="text-xs leading-4 text-ns-muted">AI assistant · replies instantly</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ns-muted transition-colors hover:bg-ns-surface hover:text-ns-text ${focusRing}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="size-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          <span className="sr-only">Close chat</span>
        </button>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {bubbles.map((item) => (
          <div
            key={item.id}
            className={item.from === "visitor" ? "flex justify-end" : "flex justify-start"}
          >
            <div className="max-w-[85%]">
              <p
                className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-[1.45] break-words whitespace-pre-line ${
                  item.from === "visitor"
                    ? "rounded-br-md bg-ns-primary text-ns-on-primary"
                    : item.error
                      ? "rounded-bl-md border border-ns-border bg-ns-background text-ns-text"
                      : "rounded-bl-md bg-ns-surface text-ns-text"
                }`}
              >
                <span className="sr-only">
                  {item.from === "visitor" ? "You: " : `${businessName}: `}
                </span>
                {item.text}
              </p>
              {item.offerBooking && (
                <a
                  href="#book"
                  onClick={onClose}
                  className={`mt-2 inline-flex min-h-10 items-center rounded-full bg-ns-primary px-4 text-sm font-semibold text-ns-on-primary ${focusRing}`}
                >
                  Book online
                </a>
              )}
              {item.leadSaved && (
                <p className="mt-1.5 text-xs text-ns-muted">Your details were sent to the team.</p>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <p
              role="status"
              className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-ns-surface px-3.5 py-3"
            >
              <span className="sr-only">Typing…</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  aria-hidden="true"
                  style={{ animationDelay: `${delay}ms` }}
                  className="size-1.5 rounded-full bg-ns-muted motion-safe:animate-pulse"
                />
              ))}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-ns-border px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {ended ? (
          <p className="px-1 py-2 text-sm text-ns-muted">
            This chat has ended. Close it to start a new one.
          </p>
        ) : (
          <form onSubmit={send} className="flex items-end gap-2">
            <label htmlFor={`${id}-input`} className="sr-only">
              Your message
            </label>
            <textarea
              id={`${id}-input`}
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={ASSISTANT_MAX_CHARS}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onInputKey}
              placeholder="Type your question…"
              className={`max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-ns-border bg-ns-background px-3.5 py-2.5 text-base leading-6 text-ns-text placeholder:text-ns-muted sm:text-[15px] ${focusRing} field-sizing-content`}
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ns-primary text-ns-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
              </svg>
              <span className="sr-only">Send</span>
            </button>
          </form>
        )}
        <p className="mt-2 px-1 text-[11px] leading-4 text-ns-muted">
          {left <= 50 && !ended
            ? `${left} characters left`
            : "AI answers can be wrong. For anything important, contact us directly."}
        </p>
      </div>
    </section>
  );
}
