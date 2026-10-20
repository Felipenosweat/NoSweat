// Alerta de erro de produção para a equipe, por e-mail (API HTTP da Resend, sem SDK).
// Só liga com ALERT_EMAIL (quem recebe) e RESEND_API_KEY; sem as duas, não faz nada.
// No máximo um e-mail por rota a cada 10 minutos (em memória, por instância do servidor):
// o alerta só avisa que algo quebrou; o detalhe fica nos logs da Vercel (procure pelo digest).
// Nunca lança: um alerta que falha não pode virar um segundo erro para o cliente.
// Sem imports do Node: também roda no runtime edge (instrumentation.ts).

export type ErrorReport = {
  /** Rota ou página que falhou (ex.: "/api/sites/[id]/publish"). */
  route: string;
  /** Digest do Next (o mesmo "Error ID" mostrado na tela de erro). */
  digest?: string;
  message: string;
  /** Método HTTP, quando houver. */
  method?: string;
};

export type AlertEnv = {
  ALERT_EMAIL?: string;
  RESEND_API_KEY?: string;
  LEADS_FROM_EMAIL?: string;
  VERCEL_ENV?: string;
};

export const ALERT_WINDOW_MS = 10 * 60_000;
const DEFAULT_FROM = "No Sweat <alerts@nosweatfd.com>";
const TIMEOUT_MS = 5_000;
const MAX_MESSAGE = 2_000;
/** Rotas guardadas no limite em memória (acima disso, começa do zero). */
const MAX_ROUTES = 500;

const lastSentAt = new Map<string, number>();

/** Esquece os envios recentes (só para os testes). */
export function resetAlertLimiter(): void {
  lastSentAt.clear();
}

/** Texto curto e de uma linha para o assunto (sem quebras de linha). */
function oneLine(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Mensagem de um erro qualquer (Error, texto ou outra coisa lançada). */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

/** Digest do Next, se o erro tiver um. */
export function errorDigest(error: unknown): string | undefined {
  if (error && typeof error === "object" && "digest" in error) {
    const digest = (error as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest) return digest;
  }
  return undefined;
}

/**
 * Manda o alerta (se configurado e fora do limite). Devolve `true` se o e-mail saiu.
 * `env` e `fetchImpl` existem para os testes.
 */
export async function reportError(
  report: ErrorReport,
  env: AlertEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<boolean> {
  try {
    const to = env.ALERT_EMAIL?.trim();
    const apiKey = env.RESEND_API_KEY;
    if (!to || !apiKey) return false;

    const route = oneLine(report.route || "unknown", 200) || "unknown";
    const last = lastSentAt.get(route);
    if (last !== undefined && now - last < ALERT_WINDOW_MS) return false;
    if (lastSentAt.size >= MAX_ROUTES) lastSentAt.clear();
    // Marca antes de enviar: vários erros ao mesmo tempo geram um e-mail só.
    lastSentAt.set(route, now);

    const message = report.message.slice(0, MAX_MESSAGE);
    const lines = [
      `Route: ${report.method ? `${report.method} ` : ""}${route}`,
      `Time: ${new Date(now).toISOString()}`,
      `Environment: ${env.VERCEL_ENV || "unknown"}`,
      `Error ID (digest): ${report.digest || "none"}`,
      "",
      message,
      "",
      "Details are in Vercel → Logs (search for the Error ID or the route).",
      "More errors on this route in the next 10 minutes will not send another email.",
    ];

    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.LEADS_FROM_EMAIL || DEFAULT_FROM,
        to: to
          .split(",")
          .map((address) => address.trim())
          .filter(Boolean),
        subject: `[No Sweat] Error on ${route}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[alert] Resend failed (${res.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[alert] could not send the error alert", error);
    return false;
  }
}
