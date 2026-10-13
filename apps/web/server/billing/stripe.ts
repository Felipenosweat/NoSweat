import { createHmac, timingSafeEqual } from "node:crypto";

// Cliente mínimo da API REST do Stripe (sem SDK): formulário x-www-form-urlencoded com a
// chave secreta e verificação da assinatura do webhook (cabeçalho Stripe-Signature).

export type StripeConfig = { secretKey: string; webhookSecret: string | null };

/** `null` = cobrança desligada (sem STRIPE_SECRET_KEY): o app funciona sem cobrar. */
export function getStripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return { secretKey, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || null };
}

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Params = Record<string, unknown>;

/** { a: { b: [1] } } → "a[b][0]=1" (formato que a API do Stripe espera). */
export function encodeForm(params: Params, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          parts.push(...encodeForm(item as Params, `${name}[${index}]`));
        } else {
          parts.push(
            `${encodeURIComponent(`${name}[${index}]`)}=${encodeURIComponent(String(item))}`,
          );
        }
      });
    } else if (typeof value === "object") {
      parts.push(...encodeForm(value as Params, name));
    } else {
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

export async function stripeRequest<T>(
  config: StripeConfig,
  method: "GET" | "POST",
  path: string,
  params: Params = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const body = encodeForm(params).join("&");
  const url = `https://api.stripe.com/v1${path}${method === "GET" && body ? `?${body}` : ""}`;
  const res = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!res.ok) {
    throw new StripeError(
      json?.error?.message ?? `Stripe request failed (${res.status})`,
      res.status,
    );
  }
  return json as T;
}

/**
 * Confere o cabeçalho Stripe-Signature ("t=<ts>,v1=<hmac>") contra o corpo cru do webhook.
 * Recusa assinaturas com mais de 5 minutos (evita reenvio de eventos antigos).
 */
export function verifyWebhookSignature(
  payload: string,
  header: string | null,
  secret: string,
  now: number = Date.now(),
  toleranceSeconds = 300,
): boolean {
  if (!header) return false;
  const fields = header.split(",").map((part) => part.split("=") as [string, string]);
  const timestamp = Number(fields.find(([k]) => k === "t")?.[1]);
  const signatures = fields.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig ?? "");
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
