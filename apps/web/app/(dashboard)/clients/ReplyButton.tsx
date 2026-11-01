"use client";

import {
  ClientReplyRequest,
  ClientReplyResponse,
  type ClientStage,
  type ReplyChannel,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { GlassButton, GlassSheet, Notice } from "@/components/glass";
import { REPLY_TEMPLATES, buildReplyTemplate, type ReplyTemplateId } from "@/lib/clients";
import { firstNameOf, mailtoHref, smsHref } from "@/lib/reviews";
import { ErrorNote, clientUrl, clientsApi, toClientsError, type ClientsApiError } from "./api";
import { MailIcon, choicePill, fieldClass, fieldErrorClass, hintClass, labelClass } from "./ui";

// Botão "Reply" (clientes novos: pedidos do site) e a folha para responder/confirmar o serviço.
// E-mail: a plataforma envia (POST /api/clients/[id]/reply). Sem o envio ligado (503
// `email_not_configured`) ou no SMS (não há provedor), abre o app do celular com o texto pronto e
// o dono toca em "I sent it" para entrar no histórico. A folha só existe enquanto está aberta:
// cada abertura recomeça com o texto do modelo (sem copiar props para estado em efeitos).

export type ReplyClient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: ClientStage;
};

/** Dados da empresa que entram no texto (só o que o dono cadastrou). */
export type ReplyCompany = { name: string; phone: string | null };

const CHANNEL_LABELS: Record<ReplyChannel, string> = { email: "Email", sms: "Text message" };

type Phase = "compose" | "fallback" | "done";

export function ReplyButton({
  client,
  company,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  client: ReplyClient;
  company: ReplyCompany;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GlassButton
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        icon={<MailIcon />}
        onClick={() => setOpen(true)}
        aria-label={`Reply to ${client.name}`}
      >
        Reply
      </GlassButton>
      {open && <ReplySheet client={client} company={company} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReplySheet({
  client,
  company,
  onClose,
}: {
  client: ReplyClient;
  company: ReplyCompany;
  onClose: () => void;
}) {
  const router = useRouter();
  const ids = useId();
  const firstName = firstNameOf(client.name);

  const [initial] = useState(() =>
    buildReplyTemplate({
      template: "confirm",
      firstName,
      company: company.name,
      phone: company.phone,
    }),
  );
  const [channel, setChannel] = useState<ReplyChannel>(client.email ? "email" : "sms");
  const [template, setTemplate] = useState<ReplyTemplateId>("confirm");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [subject, setSubject] = useState(initial.subject);
  const [message, setMessage] = useState(initial.message);
  const [moveStage, setMoveStage] = useState(true);
  const [phase, setPhase] = useState<Phase>("compose");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [doneText, setDoneText] = useState("");

  const hasContact = Boolean(client.email || client.phone);
  const canMove = client.stage === "new" && template === "confirm";

  /** Troca o modelo e/ou o dia e a hora: reescreve assunto e texto (o que foi digitado se perde). */
  function applyTemplate(next: ReplyTemplateId, nextDate: string, nextTime: string) {
    const built = buildReplyTemplate({
      template: next,
      firstName,
      company: company.name,
      phone: company.phone,
      when: next === "confirm" && (nextDate || nextTime) ? { date: nextDate, time: nextTime } : null,
    });
    setTemplate(next);
    setDate(nextDate);
    setTime(nextTime);
    setSubject(built.subject);
    setMessage(built.message);
    setFieldError(null);
  }

  async function submit(mode: "send" | "log") {
    setError(null);
    const parsed = ClientReplyRequest.safeParse({
      channel,
      mode,
      ...(channel === "email" ? { subject } : {}),
      message,
      confirmation: template === "confirm",
      ...(canMove ? { moveToContacted: moveStage } : {}),
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Check the message and try again.");
      return;
    }
    setFieldError(null);
    setPending(true);
    try {
      const result = await clientsApi(clientUrl(client.id, "/reply"), ClientReplyResponse, {
        method: "POST",
        body: parsed.data,
      });
      setDoneText(
        result.delivery === "sent"
          ? `Email sent to ${client.email ?? "your client"}. If they answer, it comes to your business email.`
          : "Saved. It now shows in this client's activity.",
      );
      setPhase("done");
    } catch (err) {
      const problem = toClientsError(err);
      if (problem.code === "email_not_configured") setPhase("fallback");
      else setError(problem);
    } finally {
      setPending(false);
    }
  }

  function close() {
    // O texto "enviado" só vira etapa nova/histórico na tela ao fechar (a linha pode sair de
    // "New" e a folha sumiria no meio da confirmação).
    if (phase === "done") router.refresh();
    onClose();
  }

  const mailLink = client.email ? mailtoHref(client.email, subject, message) : null;
  const smsLink = client.phone ? smsHref(client.phone, message) : null;
  const fromPhone = channel === "sms";
  const needsPhoneApp = fromPhone || phase === "fallback";
  const appLink = fromPhone ? smsLink : mailLink;

  let footer: ReactNode;
  if (!hasContact) {
    footer = (
      <GlassButton variant="secondary" onClick={close}>
        Close
      </GlassButton>
    );
  } else if (phase === "done") {
    footer = (
      <GlassButton variant="primary" onClick={close}>
        Done
      </GlassButton>
    );
  } else if (needsPhoneApp) {
    footer = (
      <>
        <GlassButton variant="ghost" onClick={close} disabled={pending}>
          Cancel
        </GlassButton>
        {appLink && (
          <GlassButton variant="secondary" href={appLink}>
            {fromPhone ? "Open messages app" : "Open email app"}
          </GlassButton>
        )}
        <GlassButton variant="primary" loading={pending} onClick={() => void submit("log")}>
          I sent it
        </GlassButton>
      </>
    );
  } else {
    footer = (
      <>
        <GlassButton variant="ghost" onClick={close} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          loading={pending}
          onClick={() => void submit("send")}
        >
          {pending ? "Sending…" : "Send email"}
        </GlassButton>
      </>
    );
  }

  return (
    <GlassSheet
      open
      onClose={close}
      dismissible={!pending}
      size="md"
      title={`Reply to ${client.name}`}
      description={
        phase === "done"
          ? undefined
          : "Your client sees exactly what you write here. Nothing is added or promised for you."
      }
      footer={footer}
    >
      {phase === "done" ? (
        <Notice tone="success" size="sm">
          {doneText}
        </Notice>
      ) : !hasContact ? (
        <Notice tone="warning" size="sm">
          This client has no email or phone number yet. Add one from their page, then reply.
        </Notice>
      ) : (
        <div className="grid gap-4">
          <div>
            <p className={labelClass}>To</p>
            <p className="mt-1 text-[15px] leading-6 break-words text-ink">
              <span className="font-semibold">{client.name}</span>
              {client.email && (
                <span className="block text-(--glass-fg-muted)">{client.email}</span>
              )}
              {client.phone && (
                <span className="block text-(--glass-fg-muted)">{client.phone}</span>
              )}
            </p>
          </div>

          {client.email && client.phone && (
            <fieldset disabled={pending}>
              <legend className={labelClass}>Send by</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["email", "sms"] as const).map((option) => (
                  <label key={option} className={choicePill}>
                    <input
                      type="radio"
                      name={`${ids}-channel`}
                      value={option}
                      checked={channel === option}
                      onChange={() => {
                        setChannel(option);
                        setPhase("compose");
                        setError(null);
                      }}
                      className="sr-only"
                    />
                    {CHANNEL_LABELS[option]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset disabled={pending}>
            <legend className={labelClass}>Start from</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REPLY_TEMPLATES.map((option) => (
                <label key={option.id} className={choicePill}>
                  <input
                    type="radio"
                    name={`${ids}-template`}
                    value={option.id}
                    checked={template === option.id}
                    onChange={() => applyTemplate(option.id, date, time)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {template === "confirm" && (
            <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Day and time (optional)</legend>
              <div>
                <label htmlFor={`${ids}-date`} className={labelClass}>
                  Day <span className="font-normal text-(--glass-fg-muted)">(optional)</span>
                </label>
                <input
                  id={`${ids}-date`}
                  type="date"
                  value={date}
                  onChange={(event) => applyTemplate(template, event.target.value, time)}
                  className={`${fieldClass} mt-1.5 h-11`}
                />
              </div>
              <div>
                <label htmlFor={`${ids}-time`} className={labelClass}>
                  Time <span className="font-normal text-(--glass-fg-muted)">(optional)</span>
                </label>
                <input
                  id={`${ids}-time`}
                  type="time"
                  value={time}
                  onChange={(event) => applyTemplate(template, date, event.target.value)}
                  className={`${fieldClass} mt-1.5 h-11`}
                />
              </div>
              <p className={`${hintClass} sm:col-span-2`}>
                Picking a day or time rewrites the message below.
              </p>
            </fieldset>
          )}

          {channel === "email" && phase !== "fallback" && (
            <div>
              <label htmlFor={`${ids}-subject`} className={labelClass}>
                Subject
              </label>
              <input
                id={`${ids}-subject`}
                value={subject}
                maxLength={150}
                disabled={pending}
                onChange={(event) => setSubject(event.target.value)}
                className={`${fieldClass} mt-1.5 h-11`}
              />
            </div>
          )}

          <div>
            <label htmlFor={`${ids}-message`} className={labelClass}>
              Message
            </label>
            <textarea
              id={`${ids}-message`}
              value={message}
              rows={7}
              maxLength={2000}
              disabled={pending}
              onChange={(event) => setMessage(event.target.value)}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `${ids}-message-error` : undefined}
              className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
            />
            {fieldError && (
              <p id={`${ids}-message-error`} className={fieldErrorClass}>
                {fieldError}
              </p>
            )}
          </div>

          {canMove && (
            <label className="flex min-h-11 items-center gap-3 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={moveStage}
                disabled={pending}
                onChange={(event) => setMoveStage(event.target.checked)}
                className="size-5 accent-brand"
              />
              Move {firstName || "this client"} to Contacted
            </label>
          )}

          {phase === "fallback" && (
            <Notice tone="info" size="sm">
              Sending email from No Sweat isn&rsquo;t set up yet. Open your own email app with this
              message, send it, then tap &ldquo;I sent it&rdquo; so it shows in the activity.
            </Notice>
          )}
          {fromPhone && (
            <Notice tone="info" size="sm">
              Text messages go from your phone. Open the messages app, tap send, then tap &ldquo;I
              sent it&rdquo; so it shows in the activity.
            </Notice>
          )}
          {error && <ErrorNote error={error} />}
        </div>
      )}
    </GlassSheet>
  );
}
