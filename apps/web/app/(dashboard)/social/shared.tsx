"use client";

import { ApiError, type SocialPost, type SocialPostStatus } from "@nosweat/schema";
import Link from "next/link";
import type { z } from "zod";
import { GlassBadge, Notice, type GlassBadgeTone } from "@/components/glass";

// Peças comuns da tela /social: chamada à API validada, fuso da empresa e selos de status.

/** Erro da API já traduzido para o dono (`code` vem do formato `{ error: { code, message } }`). */
export class SocialApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SocialApiError";
  }
}

/** fetch + validação da resposta com o schema. Erros viram `SocialApiError`. */
export async function socialApi<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: { method?: string; body?: unknown; form?: FormData },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.form ?? (init?.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
  } catch {
    throw new SocialApiError(
      "network",
      "We couldn't reach our servers. Check your connection and try again.",
      0,
    );
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiError.safeParse(json);
    throw new SocialApiError(
      parsed.success ? parsed.data.error.code : "internal_error",
      parsed.success ? parsed.data.error.message : "Something went wrong. Please try again.",
      res.status,
    );
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new SocialApiError(
      "internal_error",
      "Something went wrong. Please refresh the page.",
      500,
    );
  }
  return parsed.data;
}

/** Mensagem de erro com o atalho certo (planos para 402). */
export function ErrorNote({
  error,
  className = "",
}: {
  error: SocialApiError;
  className?: string;
}) {
  return (
    <Notice tone="error" size="sm" className={className}>
      {error.message}
      {error.code === "payment_required" && (
        <>
          {" "}
          <Link href="/billing?from=social" className="font-semibold underline underline-offset-4">
            See plans
          </Link>
        </>
      )}
      {error.code === "out_of_credits" && (
        <>
          {" "}
          <Link href="/billing#credits" className="font-semibold underline underline-offset-4">
            Get more credits
          </Link>
        </>
      )}
    </Notice>
  );
}

export function toApiError(error: unknown): SocialApiError {
  return error instanceof SocialApiError
    ? error
    : new SocialApiError("internal_error", "Something went wrong. Please try again.", 500);
}

// ---------- fuso horário da empresa ----------

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

/** Data e hora de um instante no fuso pedido. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  let cached = partsFormatters.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    partsFormatters.set(timeZone, cached);
  }
  const parts = cached.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour") % 24,
    minute: value("minute"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" do instante no fuso da empresa. */
export function zonedDateKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "HH:MM" do instante no fuso da empresa. */
export function zonedTimeKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM" de hoje no fuso da empresa. */
export function currentMonth(timeZone: string, now: Date = new Date()): string {
  return zonedDateKey(now, timeZone).slice(0, 7);
}

/** Diferença (ms) entre o relógio do fuso e o UTC naquele instante. */
function offsetMs(timestamp: number, timeZone: string): number {
  const p = zonedParts(new Date(timestamp), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(timestamp / 60_000) * 60_000;
}

/** "YYYY-MM-DD" + "HH:MM" no fuso da empresa → ISO em UTC (mesma regra do servidor). */
export function zonedToUtcIso(date: string, time: string, timeZone: string): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const [hh = 0, mm = 0] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let guess = wall - offsetMs(wall, timeZone);
  // Segunda passada acerta as datas perto da troca de horário de verão.
  guess = wall - offsetMs(guess, timeZone);
  return new Date(guess).toISOString();
}

/** Primeiro e último instante do mês no fuso da empresa (para GET /api/social/posts). */
export function monthRange(month: string, timeZone: string): { from: string; to: string } {
  const [y = 2000, m = 1] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return {
    from: zonedToUtcIso(`${month}-01`, "00:00", timeZone),
    to: zonedToUtcIso(`${next}-01`, "00:00", timeZone),
  };
}

export function shiftMonth(month: string, delta: number): string {
  const [y = 2000, m = 1] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

export function monthLabel(month: string): string {
  const [y = 2000, m = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** "Tue, Oct 21 · 10:00 AM" no fuso da empresa. */
export function formatWhen(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Nome curto do fuso ("EDT", "CST"...) para mostrar ao lado da hora. */
export function zoneName(timeZone: string, at: Date = new Date()): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

// ---------- status dos posts ----------

export type StatusTone = "neutral" | "attention" | "queued" | "done" | "problem";
type Tone = StatusTone;

const DOT: Record<Tone, string> = {
  neutral: "bg-slate-400",
  attention: "bg-amber-500",
  queued: "bg-brand",
  done: "bg-emerald-500",
  problem: "bg-red-500",
};

/** Rótulo e cor de cada status. `draft` com data = "Needs approval". */
export function statusInfo(post: Pick<SocialPost, "status" | "scheduledAt">): {
  label: string;
  tone: Tone;
} {
  const map: Record<SocialPostStatus, { label: string; tone: Tone }> = {
    draft: post.scheduledAt
      ? { label: "Needs approval", tone: "attention" }
      : { label: "Draft", tone: "neutral" },
    approved: { label: "Ready to post", tone: "attention" },
    scheduled: { label: "Scheduled", tone: "queued" },
    publishing: { label: "Posting now", tone: "queued" },
    needs_check: { label: "Checking", tone: "queued" },
    published: { label: "Published", tone: "done" },
    manual_published: { label: "Posted manually", tone: "done" },
    failed: { label: "Failed", tone: "problem" },
    paused: { label: "Paused", tone: "attention" },
    missed: { label: "Missed", tone: "problem" },
    canceled: { label: "Canceled", tone: "neutral" },
  };
  return map[post.status];
}

/** Tom do selo de vidro de cada grupo de status. */
const BADGE_TONE: Record<Tone, GlassBadgeTone> = {
  neutral: "draft",
  attention: "pending",
  queued: "info",
  done: "live",
  problem: "danger",
};

/** Fundo e texto das "pílulas" de post na grade do mês (cor clara + texto escuro: AA). */
export const CHIP_TONE: Record<Tone, string> = {
  neutral: "bg-white/70 text-ink",
  attention: "bg-amber-50/90 text-amber-950",
  queued: "bg-blue-50/90 text-[#0b3a85]",
  done: "bg-emerald-50/90 text-emerald-950",
  problem: "bg-red-50/90 text-red-900",
};

export function StatusChip({
  post,
  size = "md",
}: {
  post: Pick<SocialPost, "status" | "scheduledAt">;
  size?: "sm" | "md";
}) {
  const info = statusInfo(post);
  return (
    <GlassBadge tone={BADGE_TONE[info.tone]} dot size={size}>
      {info.label}
    </GlassBadge>
  );
}

/** Bolinha pequena para a grade do mês (o rótulo vai em texto escondido). */
export function statusDot(post: Pick<SocialPost, "status" | "scheduledAt">): string {
  return DOT[statusInfo(post).tone];
}

/** Status em que o dono ainda pode editar texto, fotos e data. */
export const EDITABLE_STATUSES: SocialPostStatus[] = [
  "draft",
  "approved",
  "scheduled",
  "failed",
  "paused",
  "missed",
];

/** Ordena por data (rascunhos sem data no fim). */
export function byDate(a: SocialPost, b: SocialPost): number {
  if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.localeCompare(b.scheduledAt);
  if (a.scheduledAt) return -1;
  if (b.scheduledAt) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

/** O que falta para o post poder ser aprovado (`null` = nada, pode aprovar). */
export type ApproveBlocker = "date" | "photo" | "caption" | "past";

/**
 * Por que o post ainda não pode ser aprovado. `nowMs` vem de fora (lido uma vez ao carregar os
 * dados), para não chamar o relógio durante o render. A API recusa data no passado, e um post
 * vencido no meio do lote derrubaria a aprovação de todos.
 */
export function approveBlocker(post: SocialPost, nowMs: number): ApproveBlocker | null {
  if (post.scheduledAt === null) return "date";
  if (post.media.length === 0) return "photo";
  if (post.caption.trim().length === 0) return "caption";
  if (Date.parse(post.scheduledAt) <= nowMs) return "past";
  return null;
}

/** Pronto para aprovar: data no futuro, pelo menos uma foto (o Instagram exige) e legenda. */
export function canApprove(post: SocialPost, nowMs: number): boolean {
  return approveBlocker(post, nowMs) === null;
}
