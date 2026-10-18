// Fora do arquivo "use client" do formulário para poder ser usado (e testado) em qualquer lugar.

/** Junta os campos extras preenchidos e a mensagem num texto só (o `message` da API). */
export function foldMessage(extras: { label: string; value: string }[], message: string): string {
  const lines = extras
    .filter((extra) => extra.value.trim())
    .map((extra) => `${extra.label.replace(/\?$/, "")}: ${extra.value.trim()}`)
    .join("\n");
  const text = message.trim();
  // Linha em branco entre os campos extras e o texto da pessoa.
  return [lines, text].filter(Boolean).join("\n\n");
}
