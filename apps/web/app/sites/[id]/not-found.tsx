import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/app/(dashboard)/AccountShell";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";
import { getViewer } from "@/server/auth/viewer";

// Site que não existe (ou é de outra pessoa) em /sites/[id] e no editor: a mesma moldura do
// painel da página do site, para o cliente ter o caminho de volta. Visitante sem conta: só o
// conteúdo, com o próprio <main> (dentro da moldura, o <main> é o dela).

export const metadata: Metadata = { title: "Site not found", robots: { index: false } };

function Content() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <h1 className="font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.022em] text-ink">
        We couldn&rsquo;t find that site
      </h1>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
        The link may be wrong, or the site was removed.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className={primaryButton}>
          Back to dashboard
        </Link>
        <Link href="/create" className={secondaryButton}>
          Create a new site
        </Link>
      </div>
    </div>
  );
}

export default async function SiteNotFound() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <main id="main" className="mx-auto min-h-screen max-w-[1080px] px-5 sm:px-8">
        <Content />
      </main>
    );
  }
  return (
    <AccountShell viewer={viewer}>
      <Content />
    </AccountShell>
  );
}
