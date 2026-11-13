import Link from "next/link";
import type { ReactNode } from "react";

// Botão em pílula da landing: texto + seta ↗ num círculo (ver .lp-pill em landing.css).

// Contorno de foco da marca; na pílula clara (sobre a bolha escura) o contorno é branco.
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2";

export function PillArrow() {
  return (
    <span aria-hidden="true" className="lp-pill-arrow">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M4 10 10 4M5 4h5v5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Pill({
  href,
  children,
  tone = "ink",
}: {
  href: string;
  children: ReactNode;
  tone?: "ink" | "blue" | "light";
}) {
  const cls = `lp-pill ${tone === "blue" ? "lp-pill-blue" : tone === "light" ? "lp-pill-light" : ""} ${focus} ${
    tone === "light" ? "focus-visible:outline-white" : "focus-visible:outline-brand"
  }`;
  // Âncoras da própria página não precisam do roteador.
  return href.startsWith("#") ? (
    <a href={href} className={cls}>
      {children}
      <PillArrow />
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
      <PillArrow />
    </Link>
  );
}
