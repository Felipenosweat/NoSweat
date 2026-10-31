"use client";

import Link from "next/link";
import { PageHeader, primaryButton, secondaryButton } from "@/components/DashboardUi";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";

// Erro numa tela do painel (ex.: banco fora do ar). Fica dentro do layout do grupo (dashboard):
// a barra lateral e as abas continuam, e o cliente nunca fica sem caminho de volta.
// O detalhe fica nos logs da Vercel, procurando pelo `digest`.
// Mesmo cabeçalho das outras telas (PageHeader): título, apoio e as ações à direita.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="Something went wrong"
        description={<>We couldn&rsquo;t load this page right now. Please try again in a moment.</>}
        actions={
          <>
            <Link href="/dashboard" className={secondaryButton}>
              Back to dashboard
            </Link>
            <button type="button" onClick={reset} className={primaryButton}>
              Try again
            </button>
          </>
        }
      />
      <p className="mt-6 max-w-[60ch] text-sm leading-[1.6] text-(--glass-fg-muted)">
        Still not working? Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        {error.digest ? " and include the Error ID below." : "."}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-(--glass-fg-muted)">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
