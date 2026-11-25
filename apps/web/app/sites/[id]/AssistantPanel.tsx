"use client";

import {
  ApiError,
  AssistantSettingsResponse,
  AssistantTranscriptResponse,
  type AssistantConversationSummary,
  type AssistantMessage,
} from "@nosweat/schema";
import Link from "next/link";
import { useState } from "react";
import { MessagesIcon } from "@/app/(dashboard)/NavIcons";
import {
  ChevronRightIcon,
  IconTile,
  StatusBadge,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
} from "@/components/DashboardUi";
import { Notice } from "@/components/glass";
import { LocalTime } from "@/components/LocalTime";

// Painel "AI assistant" da página do site (/sites/[id]): liga/desliga o atendente de IA do site
// publicado (Premium), explica a cobrança em créditos e mostra as últimas 30 conversas. A
// conversa inteira só é baixada quando o dono abre o item.

const linkClass = `rounded-sm font-medium text-brand underline-offset-4 hover:underline ${focusRing}`;

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = ApiError.safeParse(await res.json().catch(() => null));
  return body.success ? body.data.error.message : fallback;
}

function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
  describedBy: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors aria-checked:bg-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`}
    >
      <span
        aria-hidden="true"
        className={`size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${checked ? "translate-x-7" : "translate-x-1"}`}
      />
    </button>
  );
}

function SparkIcon({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9L12 3.5Z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </svg>
  );
}

type Transcript =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; messages: AssistantMessage[] };

function ConversationItem({
  siteId,
  conversation,
}: {
  siteId: string;
  conversation: AssistantConversationSummary;
}) {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const bodyId = `assistant-conversation-${conversation.id}`;

  async function load() {
    setTranscript({ status: "loading" });
    try {
      const res = await fetch(`/api/sites/${siteId}/assistant/conversations/${conversation.id}`);
      if (!res.ok) {
        setTranscript({
          status: "error",
          message: await errorMessage(res, "We couldn't load this conversation."),
        });
        return;
      }
      const parsed = AssistantTranscriptResponse.safeParse(await res.json());
      setTranscript(
        parsed.success
          ? { status: "ready", messages: parsed.data.messages }
          : { status: "error", message: "We couldn't load this conversation." },
      );
    } catch {
      setTranscript({
        status: "error",
        message: "We couldn't reach our servers. Please try again.",
      });
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && (transcript === null || transcript.status === "error")) void load();
  }

  const messages = conversation.visitorMessages;
  return (
    <li className="py-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        className={`flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-xl py-2.5 text-left ${focusRing}`}
      >
        <ChevronRightIcon
          className={`mt-1 size-4 shrink-0 text-(--glass-fg-muted) transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] leading-6 font-medium text-ink">
            {conversation.preview ?? "Conversation"}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-(--glass-fg-muted) tabular-nums">
            <LocalTime iso={conversation.createdAt} />
            <span>
              {messages} {messages === 1 ? "message" : "messages"} · {conversation.creditsCharged}{" "}
              {conversation.creditsCharged === 1 ? "credit" : "credits"}
            </span>
          </span>
        </span>
        {conversation.leadCaptured && <StatusBadge tone="live">Contact saved</StatusBadge>}
      </button>
      <div id={bodyId} hidden={!open} className="pb-3 pl-7">
        {transcript?.status === "loading" && (
          <p className="text-[13px] text-(--glass-fg-muted)" role="status">
            Loading…
          </p>
        )}
        {transcript?.status === "error" && (
          <Notice tone="error" size="sm">
            {transcript.message}
          </Notice>
        )}
        {transcript?.status === "ready" && (
          <ol className="space-y-2">
            {transcript.messages.map((message, index) => (
              <li
                key={`${message.createdAt}-${index}`}
                className={message.role === "visitor" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-[1.5] break-words whitespace-pre-line ${
                    message.role === "visitor"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="sr-only">
                    {message.role === "visitor" ? "Visitor: " : "Assistant: "}
                  </span>
                  {message.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

export function AssistantPanel({
  siteId,
  initial,
  isPublished,
}: {
  siteId: string;
  initial: AssistantSettingsResponse;
  isPublished: boolean;
}) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setEnabled(enabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/assistant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setError(await errorMessage(res, "We couldn't save this change."));
        return;
      }
      const parsed = AssistantSettingsResponse.safeParse(await res.json());
      if (parsed.success) setState(parsed.data);
      else setError("We couldn't save this change.");
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <IconTile tone="sky">
        <SparkIcon />
      </IconTile>
      <h2 id="assistant-title" className={`min-w-0 flex-1 ${panelTitle}`}>
        AI assistant
      </h2>
      <StatusBadge tone={state.available && state.enabled ? "live" : "neutral"}>
        {state.available ? (state.enabled ? "On" : "Off") : "Premium"}
      </StatusBadge>
    </div>
  );

  if (!state.available) {
    return (
      <section
        id="assistant"
        aria-labelledby="assistant-title"
        className={`${panelClass} scroll-mt-24`}
      >
        {heading}
        <p className={`mt-3 max-w-[60ch] ${panelText}`}>
          Answer your visitors 24/7. An AI assistant on your website replies to questions about your
          services, prices and hours, and sends you their contact details like your contact form
          does.
          {state.enabled && " It's paused because your current plan doesn't include it."}
        </p>
        <p className="mt-4 text-[15px]">
          <Link href="/billing#plans" className={linkClass}>
            Upgrade to Premium <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    );
  }

  const count = state.conversations.length;
  return (
    <section
      id="assistant"
      aria-labelledby="assistant-title"
      className={`${panelClass} scroll-mt-24`}
    >
      {heading}
      <div className="mt-4 flex items-start justify-between gap-4 border-t border-(--glass-rim) pt-4">
        <div className="min-w-0">
          <p id="assistant-switch-label" className="text-[15px] font-semibold text-ink">
            Answer visitors with AI
          </p>
          <p id="assistant-switch-hint" className={`mt-1 max-w-[56ch] ${panelText}`}>
            It only uses what&rsquo;s on your published website, never makes up prices or promises,
            and sends you visitors&rsquo; contact details as new requests.
            {!isPublished && " It starts working once your website is live."}
          </p>
        </div>
        <Switch
          checked={state.enabled}
          onChange={(next) => void setEnabled(next)}
          labelledBy="assistant-switch-label"
          describedBy="assistant-switch-hint"
          disabled={saving}
        />
      </div>
      <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[13px] leading-5 text-slate-600">
        <span className="font-semibold text-ink">1 AI credit per conversation</span>, +1 every 10
        messages. Each time a visitor opens the chat is a new conversation. If you run out of
        credits, the chat button hides until you have more.
      </p>
      {error && (
        <Notice tone="error" size="sm" className="mt-3">
          {error}
        </Notice>
      )}

      <h3 className="mt-6 text-[15px] font-semibold text-ink">
        Recent conversations{" "}
        <span className="font-normal text-(--glass-fg-muted) tabular-nums">({count})</span>
      </h3>
      {count === 0 ? (
        <p className={`mt-2 max-w-[60ch] ${panelText}`}>
          {state.enabled
            ? "When visitors chat with your assistant, the conversations show up here."
            : "Turn it on and your visitors' conversations will show up here."}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-(--glass-rim) border-t border-(--glass-rim)">
          {state.conversations.map((conversation) => (
            <ConversationItem key={conversation.id} siteId={siteId} conversation={conversation} />
          ))}
        </ul>
      )}
      {state.conversations.some((conversation) => conversation.leadCaptured) && (
        <p className="mt-3 text-[13px] text-(--glass-fg-muted)">
          <MessagesIcon className="mr-1 inline size-4 align-[-3px]" />
          Contact details from the chat also appear in{" "}
          <Link href="/clients" className={linkClass}>
            Clients
          </Link>
          .
        </p>
      )}
    </section>
  );
}
