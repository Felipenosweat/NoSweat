import { csvCell } from "../clients/csv";
import { tradeFromSearch } from "./brief";
import { previewPath } from "./service";
import type { ProspectRecord } from "./types";

// Exportações da prospecção (puro, sem banco):
// - "email": para a ferramenta de e-mail frio (Instantly, Smartlead...). Só quem tem e-mail e não
//   pediu para não ser contatado.
// - "calls": lista de ligações de quem NÃO tem e-mail (também sem os "do not contact").

export type ExportKind = "email" | "calls";

const EMAIL_HEADER = [
  "email",
  "business",
  "trade",
  "city",
  "state",
  "preview_url",
  "website_status",
];
const CALLS_HEADER = ["name", "phone", "city", "preview_url"];

const line = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(",");

function previewUrl(prospect: ProspectRecord, origin: string): string {
  const path = previewPath(prospect);
  return path ? `${origin.replace(/\/+$/, "")}${path}` : "";
}

export function exportRows(prospects: ProspectRecord[], kind: ExportKind): ProspectRecord[] {
  const contactable = prospects.filter((prospect) => prospect.status !== "do_not_contact");
  return kind === "email"
    ? contactable.filter((prospect) => Boolean(prospect.email))
    : contactable.filter((prospect) => !prospect.email && Boolean(prospect.phone));
}

export function prospectsToCsv(
  prospects: ProspectRecord[],
  kind: ExportKind,
  origin: string,
): string {
  const rows = exportRows(prospects, kind);
  const lines =
    kind === "email"
      ? [
          EMAIL_HEADER.join(","),
          ...rows.map((p) =>
            line([
              p.email,
              p.name,
              tradeFromSearch(p.search) ?? p.category,
              p.city,
              p.state,
              previewUrl(p, origin),
              p.websiteStatus,
            ]),
          ),
        ]
      : [
          CALLS_HEADER.join(","),
          ...rows.map((p) => line([p.name, p.phone, p.city, previewUrl(p, origin)])),
        ];
  // \r\n: o formato que o Excel espera.
  return `${lines.join("\r\n")}\r\n`;
}
