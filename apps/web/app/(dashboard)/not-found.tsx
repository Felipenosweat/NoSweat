import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, primaryButton, secondaryButton } from "@/components/DashboardUi";

// 404 dentro do painel (ex.: cliente apagado, link velho): aparece dentro do layout do grupo
// (dashboard), então a barra lateral e as abas continuam lá. Mesmo cabeçalho das outras telas.

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function DashboardNotFound() {
  return (
    <PageHeader
      title={<>We couldn&rsquo;t find that page</>}
      description="It may have been removed, or the link is out of date."
      actions={
        <>
          <Link href="/clients" className={secondaryButton}>
            Go to clients
          </Link>
          <Link href="/dashboard" className={primaryButton}>
            Back to dashboard
          </Link>
        </>
      }
    />
  );
}
