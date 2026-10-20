import type { Metadata } from "next";
import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";

// 404 dentro do painel (ex.: cliente apagado, link velho): aparece dentro do layout do grupo
// (dashboard), então a barra lateral e as abas continuam lá.

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <h1 className="font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.022em] text-ink">
        We couldn&rsquo;t find that page
      </h1>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
        It may have been removed, or the link is out of date.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className={primaryButton}>
          Back to dashboard
        </Link>
        <Link href="/clients" className={secondaryButton}>
          Go to clients
        </Link>
      </div>
    </div>
  );
}
