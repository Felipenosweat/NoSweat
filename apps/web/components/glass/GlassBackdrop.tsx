import { cx } from "./styles";

// Fundo do app para o vidro "aparecer": manchas bem suaves e desfocadas das cores da marca sobre o
// cinza-claro. Sem "use client", sem animação (nada se mexe atrás do conteúdo).
//
// Uso no layout: o contêiner precisa de `relative isolate` (o fundo fica em -z-10 dentro dele):
//   <div className="relative isolate min-h-screen">
//     <GlassBackdrop />
//     ...
//   </div>

export function GlassBackdrop({
  intensity = "soft",
  className,
}: {
  /** "soft" (padrão) para telas de trabalho; "vivid" para telas vazias/boas-vindas. */
  intensity?: "soft" | "vivid";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "glass-backdrop pointer-events-none fixed inset-0 -z-10",
        intensity === "soft" && "opacity-70",
        className,
      )}
    />
  );
}
