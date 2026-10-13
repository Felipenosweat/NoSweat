/**
 * Assinatura visual "Live URL line": `nosweatfd.com/s/` em cinza + o slug em azul,
 * com cursor piscando opcional (só com movimento permitido).
 * O tamanho vem de quem usa (className); em fundo escuro o slug usa o accent.
 */
export function UrlMotif({
  slug,
  caret = false,
  wrap = false,
  tone = "light",
  className = "",
}: {
  slug: string;
  caret?: boolean;
  /** Deixa o endereço quebrar em qualquer ponto (textos grandes ou zoom de 200%). */
  wrap?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const nowrap = wrap ? "break-all" : "whitespace-nowrap";
  return (
    <span className={className}>
      <span className={`${nowrap} ${dark ? "text-slate-300" : "text-slate-500"}`}>
        nosweatfd.com/s/
      </span>
      <wbr />
      <span className={`${nowrap} ${dark ? "text-accent" : "text-brand"}`}>
        {slug}
        {caret && (
          <span
            aria-hidden="true"
            className="ns-caret ml-[0.06em] inline-block h-[0.9em] w-[0.08em] min-w-0.5 translate-y-[0.1em] bg-current"
          />
        )}
      </span>
    </span>
  );
}
