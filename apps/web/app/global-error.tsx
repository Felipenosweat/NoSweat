"use client";

import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import "./globals.css";

// Erro no próprio layout raiz (app/layout.tsx): esta tela substitui o layout inteiro, por isso
// tem o próprio <html> e <body>. Mesmo texto do app/error.tsx. Link com <a> (recarrega a página
// do zero, que é o que se quer depois de um erro desses).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
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
            {/* <a> de propósito: o global-error substitui o layout raiz, então recarregar a página
                inteira é o jeito seguro de sair daqui. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-slate-400"
            >
              Go home
            </a>
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
      </body>
    </html>
  );
}
