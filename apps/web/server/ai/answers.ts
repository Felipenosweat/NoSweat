import type { IntakeAnswer } from "@nosweat/schema";

// As perguntas rápidas do /create (sim/não ou uma opção) viram linhas no fim da descrição do dono.
// São fatos que ELE declarou, então valem para as regras de honestidade do gerador (telefone,
// horário, "licensed & insured", forma de pagamento...). Sem respostas, a descrição não muda.

/** Tira quebras de linha e instruções soltas: a linha vai para dentro do pedido da IA. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function briefWithAnswers(brief: string, answers: readonly IntakeAnswer[] | undefined): string {
  const lines = (answers ?? [])
    .map((item) => `- ${oneLine(item.question)} ${oneLine(item.answer)}`)
    .filter((line) => line.length > 4);
  if (lines.length === 0) return brief;
  return [
    brief,
    "The owner also answered these quick questions (facts the owner stated; use them to make the site more specific, and never go beyond them):",
    ...lines,
  ].join("\n");
}
