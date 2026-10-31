"use client";

import { ApiError } from "@nosweat/schema";
import Link from "next/link";
import type { z } from "zod";
import { Notice } from "@/components/glass";

// Chamadas à API de clientes a partir dos componentes de cliente: fetch + validação da resposta
// com o schema. Erros (formato `{ error: { code, message } }`) viram `ClientsApiError`.

export class ClientsApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ClientsApiError";
  }
}

/** Faz o pedido e devolve o JSON da resposta (ou `null` sem corpo, ex.: 204). */
async function send(url: string, init?: { method?: string; body?: unknown }): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ClientsApiError(
      "network",
      "We couldn't reach our servers. Check your connection and try again.",
      0,
    );
  }
  const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiError.safeParse(json);
    throw new ClientsApiError(
      parsed.success ? parsed.data.error.code : "internal_error",
      parsed.success ? parsed.data.error.message : "Something went wrong. Please try again.",
      res.status,
    );
  }
  return json;
}

/** Pedido com resposta validada pelo schema. */
export async function clientsApi<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const json = await send(url, init);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ClientsApiError(
      "internal_error",
      "Something went wrong. Please refresh the page.",
      500,
    );
  }
  return parsed.data;
}

/** Pedido sem corpo de resposta útil (DELETE devolve 200 ou 204). */
export async function clientsApiNoContent(url: string, init: { method: string }): Promise<void> {
  await send(url, init);
}

export function toClientsError(error: unknown): ClientsApiError {
  return error instanceof ClientsApiError
    ? error
    : new ClientsApiError("internal_error", "Something went wrong. Please try again.", 500);
}

/** Mensagem de erro (com o atalho para os planos em 402). */
export function ErrorNote({
  error,
  className = "",
}: {
  error: ClientsApiError;
  className?: string;
}) {
  return (
    <Notice tone="error" size="sm" className={className}>
      {error.message}
      {error.code === "payment_required" && (
        <>
          {" "}
          <Link href="/billing?from=clients" className="font-semibold underline underline-offset-4">
            See plans
          </Link>
        </>
      )}
    </Notice>
  );
}

/** URL da API de um cliente. */
export function clientUrl(id: string, suffix = ""): string {
  return `/api/clients/${encodeURIComponent(id)}${suffix}`;
}
