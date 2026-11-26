"use client";

import { ClientResponse } from "@nosweat/schema";
import { useEffect, useState } from "react";
import { GlassButton, GlassCard, Notice, glassButtonClass } from "@/components/glass";
import { ErrorNote, officeApi, toOfficeError, type OfficeApiError } from "../office/_ui/api";
import { TextIcon } from "../office/_ui/ui";
import { isQuietHours, type ReminderRow } from "./sms-reminders";

// Cartão "Text reminders" da agenda: quem marcou para amanhã e aceitou lembretes por texto. Não há
// envio automático: cada linha abre o app de mensagens do celular do dono com o texto pronto.
// Fora do horário (8 AM às 9 PM na hora da empresa) o botão fica desligado. "They replied STOP"
// marca o cliente no cadastro e tira a linha (nunca mais entra na lista).

export function SmsReminders({
  rows,
  timeZone,
  nowMs,
  readOnly,
}: {
  rows: ReminderRow[];
  timeZone: string;
  /** Hora do servidor ao montar a página (a tela não lê o relógio na primeira pintura). */
  nowMs: number;
  readOnly: boolean;
}) {
  const [now, setNow] = useState(nowMs);
  const [stopped, setStopped] = useState<ReadonlySet<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [message, setMessage] = useState("");

  // O horário de silêncio pode começar com a página aberta: confere de minuto em minuto.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const quiet = isQuietHours(new Date(now), timeZone);
  const visible = rows.filter((row) => !stopped.has(row.clientId));

  async function markStopped(row: ReminderRow) {
    if (pendingId) return;
    setPendingId(row.bookingId);
    setError(null);
    setMessage("");
    try {
      const url = `/api/clients/${encodeURIComponent(row.clientId)}/sms-opt-out`;
      await officeApi(url, ClientResponse, { method: "POST", body: { optedOut: true } });
      setStopped((current) => new Set(current).add(row.clientId));
      setMessage(`${row.name} won't get text reminders anymore.`);
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <GlassCard as="section" aria-labelledby="sms-reminders-title" className="mt-8">
      <h2
        id="sms-reminders-title"
        className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink"
      >
        Text reminders
      </h2>
      <p className="mt-1 text-[15px] leading-6 text-slate-600">
        Tomorrow&rsquo;s customers who agreed to text reminders. Tap Text to open your messages app
        with the message ready, then press send. If someone replies STOP, tap &ldquo;They replied
        STOP&rdquo; and don&rsquo;t text them again.
      </p>

      {quiet && (
        <Notice tone="info" size="sm" className="mt-4">
          Quiet hours. Texts can only go out between 8:00 AM and 9:00 PM (your business time), so
          the Text buttons are off for now.
        </Notice>
      )}
      {message && (
        <p role="status" className="mt-4 text-[15px] font-semibold text-emerald-700">
          {message}
        </p>
      )}
      {error && <ErrorNote error={error} className="mt-4" />}

      {visible.length === 0 ? (
        <p className="mt-4 text-[15px] leading-6 text-slate-600">
          No reminders to send for tomorrow.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-(--glass-rim) border-y border-(--glass-rim)">
          {visible.map((row) => (
            <li
              key={row.bookingId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">{row.name}</p>
                <p className="text-[14px] leading-5 text-slate-600 tabular-nums">
                  {row.timeLabel} &middot; {row.serviceName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {readOnly ? null : quiet ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className={`${glassButtonClass({ variant: "primary" })} cursor-not-allowed opacity-60`}
                  >
                    Quiet hours
                  </button>
                ) : (
                  // sms: em <a> comum (não é navegação do Next).
                  <a href={row.href} className={glassButtonClass({ variant: "primary" })}>
                    <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
                      <TextIcon />
                    </span>
                    Text<span className="sr-only"> {row.name}</span>
                  </a>
                )}
                {!readOnly && (
                  <GlassButton
                    variant="secondary"
                    loading={pendingId === row.bookingId}
                    disabled={pendingId !== null}
                    onClick={() => void markStopped(row)}
                  >
                    They replied STOP
                    <span className="sr-only"> ({row.name})</span>
                  </GlassButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
