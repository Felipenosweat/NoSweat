import { sparkleCleaning } from "@nosweat/fixtures";
import Link from "next/link";
import { StatusBadge, primaryButton } from "./DashboardUi";
import { SiteThumb } from "./SiteThumb";

/**
 * Estado vazio da página inicial do painel (conta sem sites): convite para criar o primeiro
 * site, com um site de exemplo de verdade (fixture fictícia, marcada "Example") no lugar de foto
 * de banco de imagens.
 */
export function ExampleSiteEmpty() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid lg:grid-cols-12">
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-6 lg:p-12">
        <p className="max-w-[18ch] font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink lg:text-[2rem]">
          Your first site takes about a minute.
        </p>
        <p className="mt-3 max-w-[44ch] text-base leading-[1.65] text-slate-600">
          Describe your business in a sentence or two. We&rsquo;ll write the pages, pick the colors
          and set up a contact form. You can change anything before it goes live.
        </p>
        <div className="mt-6">
          <Link href="/create" className={`${primaryButton} min-h-12 px-6 sm:min-h-12`}>
            Build my website
          </Link>
        </div>
      </div>

      <figure className="p-4 pt-0 sm:p-6 sm:pt-0 lg:col-span-6 lg:p-6 lg:pl-0">
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <SiteThumb spec={sparkleCleaning} />
          <span className="absolute top-3 left-3">
            <StatusBadge tone="neutral">Example</StatusBadge>
          </span>
        </div>
        <figcaption className="mt-2 text-xs text-slate-500">
          Example site for {sparkleCleaning.business.name}, a fictional business.
        </figcaption>
      </figure>
    </div>
  );
}
