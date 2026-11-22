import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeaderTone } from "./HeaderTone";

// Cabeçalho da landing "Showroom": escuro enquanto o bloco ink (topo + pranchas) está embaixo
// dele, branco com linha fina depois. Logo, poucos links no computador, "Log in" e um botão
// azul compacto. O logo existe nas duas versões (clara e escura) e o CSS mostra a certa.

export const INK_BLOCK_ID = "showroom-ink";
const HEADER_ID = "showroom-header";

const NAV = [
  { href: "/#examples", label: "Examples" },
  { href: "/#office", label: "The office" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const textLink =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-[15px] font-semibold text-slate-300 transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-data-[tone=light]:text-slate-600 group-data-[tone=light]:hover:text-ink group-data-[tone=light]:focus-visible:outline-brand motion-reduce:transition-none";

export function ShowroomHeader() {
  return (
    <header
      id={HEADER_ID}
      data-tone="dark"
      className="group sticky top-0 z-40 border-b border-transparent bg-ink transition-colors duration-200 motion-reduce:transition-none data-[tone=light]:border-slate-200 data-[tone=light]:bg-white"
    >
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-8">
        <div className="shrink-0">
          <span className="group-data-[tone=light]:hidden">
            <Logo tone="dark" />
          </span>
          <span className="hidden group-data-[tone=light]:inline">
            <Logo />
          </span>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-4 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={textLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/login" className={textLink}>
            Log in
          </Link>
          {/* No celular o texto encurta para "Start"; o nome acessível continua completo. */}
          <Link
            href="/create"
            aria-label="Start my website"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-[15px] font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-data-[tone=light]:focus-visible:outline-brand motion-reduce:transition-none"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start my website</span>
          </Link>
        </div>
      </div>
      <HeaderTone headerId={HEADER_ID} blockId={INK_BLOCK_ID} />
    </header>
  );
}
