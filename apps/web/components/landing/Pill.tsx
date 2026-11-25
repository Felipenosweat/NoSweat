import Link from "next/link";
import type { ReactNode } from "react";
import { focusRing, focusRingOnDark } from "@/components/marketing/styles";

// Botão em pílula da landing: texto + seta ↗ num círculo (ver .lp-pill em landing.css).
// tone "blue" = a ação principal (a mesma cor do primaryButton); é o único lugar com azul.

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
  onDark = false,
}: {
  href: string;
  children: ReactNode;
  tone?: "ink" | "blue" | "light";
  /** Sobre a bolha escura: anel de foco branco. */
  onDark?: boolean;
}) {
  const cls = `lp-pill ${tone === "blue" ? "lp-pill-blue" : tone === "light" ? "lp-pill-light" : ""} ${onDark ? focusRingOnDark : focusRing}`;
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
