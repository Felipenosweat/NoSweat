"use client";

import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";

// Erro numa tela do painel (ex.: banco fora do ar). Fica dentro do layout do grupo (dashboard):
// a barra lateral e as abas continuam, e o cliente nunca fica sem caminho de volta.
// O detalhe fica nos logs da Vercel, procurando pelo `digest`.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <h1 className="font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.022em] text-ink">
        Something went wrong
      </h1>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
        We couldn&rsquo;t load this page right now. Please try again in a moment.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={primaryButton}>
          Try again
        </button>
        <Link href="/dashboard" className={secondaryButton}>
          Back to dashboard
        </Link>
      </div>
      <p className="max-w-[60ch] text-sm text-slate-500">
        Still not working? Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        {error.digest ? " and include the Error ID below." : "."}
      </p>
      {error.digest && <p className="text-xs text-slate-500">Error ID: {error.digest}</p>}
    </div>
  );
}
