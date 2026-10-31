import Image from "next/image";
import Link from "next/link";
import { StatusBadge, cardClass, primaryButton } from "./DashboardUi";

/**
 * Estado vazio da página inicial do painel (conta sem sites): convite para criar o primeiro
 * site, com a captura de um site de exemplo de verdade no molde Signature (a Still Water Spa,
 * fictícia, marcada "Example"; a mesma da landing, em public/landing/signature). Visual calmo: texto à esquerda, o exemplo "flutuando" num fundo cinza
 * claro à direita (embaixo no celular).
 */
export function ExampleSiteEmpty() {
  return (
    <div className={`overflow-hidden lg:grid lg:grid-cols-12 ${cardClass}`}>
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-5 lg:p-12">
        <p className="max-w-[16ch] font-display text-[1.75rem] leading-[1.15] font-bold tracking-[-0.022em] text-balance text-ink lg:text-[2rem]">
          Your first site takes about a minute.
        </p>
        <p className="mt-3 max-w-[44ch] text-base leading-[1.6] text-(--glass-fg-muted)">
          Describe your business in a sentence or two. We&rsquo;ll write the pages, pick the colors
          and set up a contact form. You can change anything before it goes live.
        </p>
        <div className="mt-7">
          <Link href="/create" className={`${primaryButton} min-h-12 px-6 sm:min-h-12`}>
            Build my website
          </Link>
        </div>
      </div>

      <figure className="border-t border-slate-200/70 bg-surface px-5 pt-6 pb-5 sm:px-10 sm:pt-10 lg:col-span-7 lg:border-t-0 lg:border-l lg:px-10 lg:pt-12 lg:pb-8">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgb(7_27_51/0.06),0_24px_48px_-24px_rgb(7_27_51/0.3)] ring-1 ring-slate-900/5">
          <Image
            src="/landing/signature/still-water-spa-d.webp"
            alt="Home page of Still Water Spa, an example site made with No Sweat."
            width={1600}
            height={1000}
            sizes="(min-width: 1024px) 640px, 100vw"
            className="block h-auto w-full"
          />
          <span className="absolute top-3 left-3">
            <StatusBadge tone="neutral">Example</StatusBadge>
          </span>
        </div>
        <figcaption className="mt-3 text-xs text-(--glass-fg-muted)">
          Example site for Still Water Spa, a fictional business.
        </figcaption>
      </figure>
    </div>
  );
}
