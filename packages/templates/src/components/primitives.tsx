import type { ReactNode } from "react";
import { StarIcon } from "./icons";

/** Link `tel:` a partir de um telefone formatado, ex.: "(512) 555-0142". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow";
}) {
  const maxWidth = size === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${maxWidth} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
  );
}

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-ns-primary">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-pretty text-ns-muted">{description}</p>}
    </div>
  );
}

export function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-0.5 text-ns-secondary ${className}`} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} className="size-4" />
      ))}
    </div>
  );
}

export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
