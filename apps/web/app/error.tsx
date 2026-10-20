"use client";

import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";

// Tela de erro genérica: aparece no lugar da página quando algo falha no servidor
// (ex.: banco fora do ar). O detalhe fica nos logs da Vercel, procurando pelo `digest`.
// Dentro do painel vale a de app/(dashboard)/error.tsx (com a moldura do painel).
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="font-display text-3xl font-extrabold">Something went wrong</h1>
      <p className="max-w-md text-slate-600">
        We couldn&rsquo;t load this page right now. Please try again in a moment.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-slate-400"
        >
          Go home
        </Link>
      </div>
      <p className="max-w-md text-sm text-slate-500">
        Still not working? Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        {error.digest ? " and include the Error ID below." : "."}
      </p>
      {error.digest && <p className="text-xs text-slate-400">Error ID: {error.digest}</p>}
    </main>
  );
}
