/**
 * Índice numerado de seção ("01 — How it works") no lugar dos rótulos em caixa-alta.
 * Fica sobre uma linha fina que atravessa o container. Em fundo escuro, o número usa o accent.
 */
export function SectionIndex({
  number,
  label,
  tone = "light",
}: {
  number: string;
  label: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <p
      className={`flex items-baseline gap-2 border-t pt-4 font-display text-sm font-semibold tabular-nums ${
        dark ? "border-white/15" : "border-slate-200"
      }`}
    >
      <span className={dark ? "text-accent" : "text-brand"}>{number}</span>
      <span aria-hidden="true" className="text-slate-400">
        —
      </span>
      <span className={dark ? "text-slate-300" : "text-slate-500"}>{label}</span>
    </p>
  );
}
