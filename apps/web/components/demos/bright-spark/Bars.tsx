import { BUSINESS } from "./content";
import { OpenStatus } from "./OpenStatus";

// Navegação "bottom-bar-mobile": no computador, uma barra fina presa no topo com o nome, os
// atalhos, o status de aberto/fechado e o telefone em amarelo; no celular, a mesma barra só com
// o nome e o número, e as três ações (Ligar / Mensagem / Orçamento) presas embaixo, ao alcance
// do polegar. O selo da No Sweat no fim da página já tem folga embaixo (5,5 rem) para a barra
// não cobri-lo.

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={className}>
      <rect width="28" height="28" rx="3" fill="var(--bs-yellow)" />
      <rect
        x="9"
        y="5"
        width="10"
        height="18"
        rx="2"
        fill="none"
        stroke="var(--bs-ink)"
        strokeWidth="2"
      />
      <rect x="11.5" y="7.5" width="5" height="6.5" rx="1" fill="var(--bs-ink)" />
    </svg>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" />
    </svg>
  );
}

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#area", label: "Area & hours" },
  { href: "#people", label: "Who answers" },
  { href: "#quote", label: "Quote" },
];

export function TopBar() {
  return (
    <header className="bs-top">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center gap-6 px-5 sm:px-8 lg:pr-14 lg:pl-24">
        <a href="#top" className="bs-focus flex items-center gap-2.5 font-bold tracking-[-0.01em]">
          <Mark className="size-6" />
          <span>
            {BUSINESS.short}
            <span className="hidden sm:inline"> Electric</span>
          </span>
        </a>
        <nav aria-label="Sections" className="ml-4 hidden lg:block">
          <ul className="flex gap-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="bs-top-link bs-focus">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <OpenStatus className="ml-auto hidden xl:inline-flex" />
        <a href={`tel:${BUSINESS.tel}`} className="bs-top-call bs-focus ml-auto xl:ml-0">
          <PhoneIcon className="size-4" />
          <span className="sr-only sm:hidden">Call </span>
          <span className="bs-num">{BUSINESS.phone}</span>
        </a>
      </div>
    </header>
  );
}

export function BottomBar() {
  return (
    <nav aria-label="Call, text or ask for a quote" className="bs-bottom lg:hidden">
      <a href={`tel:${BUSINESS.tel}`} className="bs-bottom-call bs-focus">
        <PhoneIcon className="size-5" />
        Call
      </a>
      <a href={`sms:${BUSINESS.tel}`} className="bs-focus">
        Text
      </a>
      <a href="#quote" className="bs-focus">
        Quote
      </a>
    </nav>
  );
}
