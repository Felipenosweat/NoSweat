import type { Metadata } from "next";

// Domínio do cliente sem site no ar (ainda não conectado, tirado do ar ou apagado). Neutra e sem
// links: no domínio do cliente, o proxy.ts manda todo caminho para /d/<host>, então um link
// relativo cairia de novo aqui.

export const metadata: Metadata = {
  title: { absolute: "Website unavailable" },
  robots: { index: false },
};

export default function DomainNotFound() {
  return (
    <main
      id="main"
      className="flex min-h-screen items-center justify-center bg-white px-4 text-center"
    >
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">
          This website isn&rsquo;t available right now.
        </h1>
        <p className="mt-3 text-slate-600">Please check the address or try again later.</p>
      </div>
    </main>
  );
}
