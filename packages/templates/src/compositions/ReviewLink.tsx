import { isGoogleReviewUrl, type Business } from "@nosweat/schema";
import { ArrowRightIcon } from "../components/icons";

// Botão "Review us on Google" (link de avaliações que o dono colou em /reviews). Um lugar só,
// usado no contato e no rodapé de todas as composições. Regra 8: nada de estrelas, notas nem
// contagem de avaliações; só o convite. Cor herdada (currentColor): funciona sobre o fundo do
// tema, sobre o bloco escuro e sobre foto, sem cor fixa.

// O mesmo foco de shared.tsx (copiado para shared.tsx poder importar este arquivo sem ciclo).
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

/** Link de avaliações do dono, se for um link do Google válido (senão, nada aparece). */
function reviewHref(business: Business): string | null {
  const href = business.googleReviewUrl;
  return href && isGoogleReviewUrl(href) ? href : null;
}

export function ReviewUsLink({
  business,
  className = "",
}: {
  business: Business;
  className?: string;
}) {
  const href = reviewHref(business);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`ns-btn inline-flex min-h-11 max-w-full items-center gap-2 border border-current/30 px-5 py-2 text-sm font-medium transition-colors duration-200 hover:border-current motion-reduce:transition-none ${focus} ${className}`}
    >
      Review us on Google
      <ArrowRightIcon className="size-4 shrink-0 -rotate-45" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A mesma coisa como item de uma lista <dl> de contato ("Reviews" + botão). */
export function ReviewUsEntry({ business }: { business: Business }) {
  if (!reviewHref(business)) return null;
  return (
    <div>
      <dt className="text-sm font-medium">Reviews</dt>
      <dd className="mt-2">
        <ReviewUsLink business={business} />
      </dd>
    </div>
  );
}
