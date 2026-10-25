import type { Client } from "@nosweat/schema";
import { STAGE_LABELS, dateKeyIn } from "@/lib/clients";

// Exportação dos clientes em CSV (abre direto no Excel, Numbers e Google Sheets). Puro: sem banco.

const HEADER = [
  "Name",
  "Phone",
  "Email",
  "Address",
  "Stage",
  "Source",
  "Tags",
  "Follow up on",
  "Jobs",
  "Total jobs (USD)",
  "Last activity",
  "Client since",
  "Notes",
] as const;

/** Telefone "de verdade" ("+1 (512) 555-0100"): começa com "+" mas não é fórmula. */
const PHONE_LIKE = /^\+?[\d\s().-]+$/;

/**
 * Uma célula: entre aspas quando precisa (vírgula, aspas, quebra de linha) e com um apóstrofo na
 * frente de textos que começam com = + - @ (o Excel trataria como fórmula: "CSV injection").
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text) && !PHONE_LIKE.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Centavos → "1250.00" (sem "$" nem vírgula de milhar: a planilha entende como número). */
function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * CSV dos clientes, na ordem recebida. Datas no fuso da empresa ("AAAA-MM-DD"). Começa com o BOM
 * do UTF-8 (o Excel lê os acentos certo) e usa CRLF, como pede a RFC 4180.
 */
export function clientsToCsv(clients: readonly Client[], timeZone: string): string {
  const day = (iso: string) => dateKeyIn(timeZone, new Date(iso));
  const rows = clients.map((client) =>
    [
      client.name,
      client.phone,
      client.email,
      client.address,
      STAGE_LABELS[client.stage],
      client.source === "website" ? "Website" : "Added by you",
      client.tags.join("; "),
      client.followUpOn,
      client.jobsCount,
      dollars(client.totalJobsCents),
      day(client.lastActivityAt),
      day(client.createdAt),
      client.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  return `﻿${[HEADER.join(","), ...rows].join("\r\n")}\r\n`;
}
