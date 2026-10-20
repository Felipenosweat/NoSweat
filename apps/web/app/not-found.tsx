import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { Logo } from "@/components/Logo";

// 404 de todo o app (endereço errado, link velho, /s/<nome> que não existe). Neutra: também
// aparece para visitantes dos sites dos clientes, então nada de propaganda da No Sweat aqui.
// No domínio próprio do cliente vale a de app/d/[host]/not-found.tsx.

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 py-6 sm:px-10 sm:py-8">
      <header>
        <Logo />
      </header>
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center"
      >
        <h1 className="font-display text-3xl font-extrabold text-ink">
          We couldn&rsquo;t find that page.
        </h1>
        <p className="max-w-md text-slate-600">
          The link may be wrong, or the page was moved or removed.
        </p>
        <Link
          href="/"
          className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Go home
        </Link>
        <p className="text-sm text-slate-500">
          Need help? Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
}
