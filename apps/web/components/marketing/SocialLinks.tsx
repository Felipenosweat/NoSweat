import type { ReactNode } from "react";
import { SOCIAL_PROFILES, type SocialNetwork } from "@/lib/social-profiles";

// Botões redondos com o ícone de cada rede da No Sweat (lista em lib/social-profiles.ts).
// "dark" para fundo escuro (landing e rodapé escuro), "light" para o rodapé claro.
// Ícones desenhados no mesmo traço (24×24): marcas simplificadas, sem cores próprias.

const ICONS: Record<SocialNetwork, ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  x: <path d="M4 4h4.5L20 20h-4.5zM19.5 4l-6.6 7.2M4.5 20l6.6-7.2" />,
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6" />,
  facebook: (
    <path d="M14 21v-8h3l.5-3.5H14V7.8c0-1 .3-1.8 1.8-1.8H18V3h-2.8C12.6 3 11 4.6 11 7.4v2.1H8V13h3v8" />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V16M8 7.5v.01M12 16v-5.5M12 13c0-1.7 1-2.6 2.3-2.6S16 11.3 16 13v3" />
    </>
  ),
};

export function SocialLinks({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  if (SOCIAL_PROFILES.length === 0) return null;
  const dark = tone === "dark";
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`}>
      {SOCIAL_PROFILES.map((profile) => (
        <li key={profile.network}>
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${profile.label} ${profile.handle} (opens in a new tab)`}
            title={`${profile.label} ${profile.handle}`}
            className={`grid size-12 place-items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              dark
                ? "border-white/20 text-white hover:border-white hover:bg-white hover:text-ink focus-visible:outline-white"
                : "border-slate-300 text-ink hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-brand"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              {ICONS[profile.network]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
