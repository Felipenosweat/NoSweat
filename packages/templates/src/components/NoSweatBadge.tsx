// Selo da No Sweat no fim de todo site de cliente: uma linha discreta ("Website by nosweatfd")
// que leva a nosweatfd.com. Não faz parte do SiteSpec (nem o editor nem a IA o alcançam) e o
// SiteRenderer sempre o desenha, sem opção para desligar: o cliente não consegue tirá-lo.
// Cores: as do rodapé do molde Signature (fundo ns-text, letra ns-background), para parecer
// a última linha do rodapé e não uma faixa de anúncio. Fora do molde (demos), as variáveis
// --nsb-bg / --nsb-fg trocam as cores.

const HREF = "https://nosweatfd.com/?utm_source=customer-site&utm_medium=badge";

export function NoSweatBadge({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Website platform"
      data-ns-badge=""
      className={`ns-badge bg-[var(--nsb-bg,var(--ns-text))] px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center text-[var(--nsb-fg,var(--ns-background))] @3xl:pb-4 ${className}`}
    >
      <a
        href={HREF}
        target="_blank"
        rel="noopener"
        className="inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.08em] opacity-75 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="6" cy="6" r="1.4" fill="currentColor" />
        </svg>
        <span>
          Website by <span className="font-semibold">nosweatfd</span>
        </span>
      </a>
    </aside>
  );
}
