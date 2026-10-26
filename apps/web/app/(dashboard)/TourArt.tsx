import type { ReactNode } from "react";
import { cx } from "@/components/glass";
import type { TourArt as TourArtKind } from "@/lib/onboarding";
import { CheckIcon, HelpIcon, SocialIcon, TourIcon, WebsiteIcon } from "./NavIcons";

// Desenhos das duas folhas do tour (boas-vindas e "tudo pronto"): pedacinhos da interface em
// vidro (cartões, cápsulas, ícones da navegação), feitos só com HTML/CSS. Nada de imagem de fora.
// O meio do tour mostra a tela de verdade (tour/SpotlightTour.tsx), não desenhos. São decorativos
// (o texto diz tudo): a folha já os marca com `aria-hidden`.
// Sem "use client" (servem em qualquer componente).

/** Linha de "texto" do desenho. */
const line = "block h-1.5 rounded-full bg-slate-300/70";

/** Cartão branco de vidro, a peça básica dos desenhos. */
const card = "glass-edge rounded-2xl bg-white/90";

/** Cápsula pequena (selo ou botão do desenho). */
function Chip({
  tone = "muted",
  children,
  className,
}: {
  tone?: "muted" | "brand" | "done" | "pending";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] leading-none font-semibold whitespace-nowrap",
        tone === "brand" && "bg-brand text-white",
        tone === "done" && "bg-emerald-100 text-emerald-800",
        tone === "pending" && "bg-amber-100 text-amber-800",
        tone === "muted" && "bg-slate-100 text-slate-600",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Ícone num quadradinho da marca. */
function IconSquare({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand [&>svg]:size-[18px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Moldura de todos os desenhos: fundo suave da marca, mesma altura em todos os passos. */
function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "glass-edge relative flex h-40 items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,rgb(0_102_255/0.10),rgb(56_189_248/0.10)_55%,rgb(16_185_129/0.08))] px-4 sm:h-44",
        className,
      )}
    >
      {/* Brilho de fundo (dá profundidade ao vidro). */}
      <span className="pointer-events-none absolute -top-10 -left-8 size-36 rounded-full bg-white/60 blur-2xl" />
      <span className="pointer-events-none absolute -right-10 -bottom-12 size-40 rounded-full bg-brand/15 blur-2xl" />
      <div className="relative w-full">{children}</div>
    </div>
  );
}

function WelcomeArt() {
  const tile = (icon: ReactNode, label: string, className?: string) => (
    <div className={cx(card, "flex w-[5.5rem] flex-col items-center gap-2 px-2 py-3", className)}>
      <IconSquare>{icon}</IconSquare>
      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
      <span className={cx(line, "w-10")} />
    </div>
  );
  return (
    <Frame>
      <div className="flex items-end justify-center gap-2.5">
        {tile(<WebsiteIcon />, "Website", "translate-y-2 -rotate-6")}
        <div className={cx(card, "flex w-[6.5rem] flex-col items-center gap-2 px-2 py-4")}>
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white [&>svg]:size-5">
            <CheckIcon />
          </span>
          <span className="text-[12px] font-semibold text-ink">Your office</span>
          <span className="flex gap-1">
            <Chip tone="done">Jobs</Chip>
            <Chip tone="pending">$</Chip>
          </span>
        </div>
        {tile(<SocialIcon />, "Instagram", "translate-y-2 rotate-6")}
      </div>
    </Frame>
  );
}

function HelpArt() {
  return (
    <Frame>
      <div className="mx-auto flex w-[min(100%,16rem)] flex-col gap-2.5">
        <div className={cx(card, "flex items-center gap-2 self-start rounded-bl-md px-3 py-2")}>
          <IconSquare className="size-6 rounded-lg [&>svg]:size-3.5">
            <HelpIcon />
          </IconSquare>
          <span className="text-[11px] font-medium text-slate-700">Hi! How can we help?</span>
        </div>
        <div className="flex items-center gap-2 self-end">
          <span
            className={cx(
              card,
              "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-ink",
            )}
          >
            <TourIcon className="size-3.5 text-brand" />
            Take the tour
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand px-3 text-[11px] font-semibold text-white">
            <HelpIcon className="size-3.5" />
            Help
          </span>
        </div>
      </div>
    </Frame>
  );
}

export function TourArt({ art }: { art: TourArtKind }) {
  switch (art) {
    case "welcome":
      return <WelcomeArt />;
    case "help":
      return <HelpArt />;
  }
}
