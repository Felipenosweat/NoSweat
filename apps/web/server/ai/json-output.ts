import { z } from "zod";

// Resposta em JSON sem a saída estruturada da API. A saída estruturada ("constrained decoding")
// recusa esquemas com mais de 24 campos opcionais, e o SiteSpec tem mais que isso. Então o
// formato vai como JSON Schema no prompt, a resposta vem como texto e o Zod confere aqui (quem
// chama decide se tenta de novo).

/** Instrução de formato: o JSON Schema do que a IA deve devolver. */
export function jsonInstructions(schema: z.ZodType): string {
  let jsonSchema = "";
  try {
    jsonSchema = JSON.stringify(z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }));
  } catch {
    // Esquema que o Zod não converte: a validação abaixo continua valendo.
  }
  return [
    "Answer with ONE JSON object and nothing else: no prose, no markdown, no code fences.",
    jsonSchema
      ? `It must match this JSON Schema:\n<json_schema>\n${jsonSchema}\n</json_schema>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Primeiro objeto JSON do texto (tolera cercas de código e texto em volta). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The answer had no JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}

type ResponseLike = {
  parsed_output?: unknown;
  content?: readonly { type: string; text?: string }[];
};

/**
 * O JSON da resposta, ainda sem validar. `parsed_output` (saída estruturada ou testes) tem
 * prioridade; senão, o texto da resposta.
 */
export function rawJson(response: ResponseLike): unknown {
  if (response.parsed_output !== undefined && response.parsed_output !== null) {
    return response.parsed_output;
  }
  const text = (response.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
  return extractJson(text);
}
