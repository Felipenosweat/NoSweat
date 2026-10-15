import { createHmac, timingSafeEqual } from "node:crypto";
import { getInstagramConfig } from "./config";

// `signed_request` que a Meta manda nos avisos de desautorização e de exclusão de dados:
// "<assinatura base64url>.<payload base64url>", assinatura = HMAC-SHA256(payload, segredo do app).

export type SignedRequestPayload = {
  user_id: string;
  algorithm: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null;
  return Buffer.from(value.replace(/=+$/, ""), "base64url");
}

/** Payload validado, ou `null` se a assinatura ou o formato não baterem. */
export function parseSignedRequest(
  signedRequest: string | null | undefined,
  appSecret: string,
): SignedRequestPayload | null {
  if (!signedRequest || !appSecret) return null;
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [encodedSig, encodedPayload] = parts as [string, string];
  const signature = decodeBase64Url(encodedSig);
  const payloadBytes = decodeBase64Url(encodedPayload);
  if (!signature || !payloadBytes) return null;

  const expected = createHmac("sha256", appSecret).update(encodedPayload).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const data = payload as Record<string, unknown>;
  const algorithm = data.algorithm;
  if (typeof algorithm !== "string" || algorithm.toUpperCase() !== "HMAC-SHA256") {
    return null;
  }
  const userId = data.user_id;
  if (typeof userId !== "string" && typeof userId !== "number") return null;
  if (String(userId).length === 0) return null;
  return { ...data, algorithm, user_id: String(userId) };
}

/** Lê o `signed_request` do formulário que a Meta manda. `null` sem app configurado ou se não bater. */
export async function readSignedRequest(request: Request): Promise<SignedRequestPayload | null> {
  const config = getInstagramConfig();
  if (!config) return null;
  let raw: FormDataEntryValue | null = null;
  try {
    raw = (await request.formData()).get("signed_request");
  } catch {
    return null;
  }
  return typeof raw === "string" ? parseSignedRequest(raw, config.appSecret) : null;
}
