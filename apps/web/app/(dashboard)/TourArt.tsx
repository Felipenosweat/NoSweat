import type { ReactNode } from "react";
import { cx } from "@/components/glass";
import type { TourArt as TourArtKind } from "@/lib/onboarding";
import { PhoneIcon, TextIcon } from "./clients/ui";
import {
  CheckIcon,
  EstimatesIcon,
  HelpIcon,
  InvoicesIcon,
  ScheduleIcon,
  SocialIcon,
  StarIcon,
  TourIcon,
  WebsiteIcon,
} from "./NavIcons";

// Desenhos dos passos do tour de boas-vindas: pedacinhos da interface em vidro (cartões,
// cápsulas, ícones da navegação), feitos só com HTML/CSS. Nada de imagem de fora. São
// decorativos (o texto do passo diz tudo): a folha já os marca com `aria-hidden`.
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
function IconSquare({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "emerald" | "amber" | "sky";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-xl [&>svg]:size-[18px]",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "emerald" && "bg-emerald-100 text-emerald-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
        tone === "sky" && "bg-sky-100 text-sky-700",
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

function WebsiteArt() {
  return (
    <Frame>
      <div className="relative mx-auto w-[min(100%,17rem)]">
        <div className={cx(card, "overflow-hidden")}>
          {/* Barra do navegador */}
          <div className="flex items-center gap-1.5 border-b border-slate-200/70 px-3 py-2">
            <span className="size-1.5 rounded-full bg-slate-300" />
            <span className="size-1.5 rounded-full bg-slate-300" />
            <span className="size-1.5 rounded-full bg-slate-300" />
            <span className="ml-2 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              yourbusiness.com
            </span>
          </div>
          <div className="flex gap-3 p-3">
            <div className="grid flex-1 content-start gap-1.5">
              <span className={cx(line, "h-2 w-11/12 bg-slate-400/70")} />
              <span className={cx(line, "w-3/4")} />
              <span className={cx(line, "w-1/2")} />
              <Chip tone="brand" className="mt-1.5 w-fit">
                <PhoneIcon className="size-2.5" />
                Call now
              </Chip>
            </div>
            <span className="h-16 w-20 shrink-0 rounded-xl bg-[linear-gradient(140deg,#bfdbfe,#99f6e4)]" />
          </div>
        </div>
        {/* Botão "Publish" flutuando sobre a prévia */}
        <div
          className={cx(
            card,
            "absolute -right-2 -bottom-4 flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5",
          )}
        >
          <Chip tone="done">Live</Chip>
          <Chip tone="brand" className="h-6 px-2.5 text-[11px]">
            Publish
          </Chip>
        </div>
      </div>
    </Frame>
  );
}

function ClientsArt() {
  return (
    <Frame>
      <div className="relative mx-auto w-[min(100%,16.5rem)]">
        {/* Cartão de trás (outro pedido), para dar a ideia de lista */}
        <div className={cx(card, "absolute inset-x-4 -top-3 h-10 opacity-60")} />
        <div className={cx(card, "relative p-3")}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-[12px] font-semibold text-sky-800">
              MG
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] leading-4 font-semibold text-ink">
                Maria G.
                <Chip tone="pending">New</Chip>
              </p>
              <p className="truncate text-[11px] leading-4 text-slate-600">
                Website request · Leak under the sink
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-brand text-[11px] font-semibold text-white">
              <PhoneIcon className="size-3" />
              Call
            </span>
            <span className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
              <TextIcon className="size-3" />
              Text
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function MoneyArt() {
  const arrow = (
    <svg
      viewBox="0 0 12 12"
      className="size-3 shrink-0 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2.5 7.5 6 4 9.5" />
    </svg>
  );
  const step = (
    icon: ReactNode,
    tone: "brand" | "sky" | "emerald",
    top: string,
    chip: ReactNode,
  ) => (
    <div className={cx(card, "flex min-w-0 flex-1 flex-col items-start gap-1.5 p-2.5")}>
      <IconSquare tone={tone} className="size-7 rounded-lg [&>svg]:size-4">
        {icon}
      </IconSquare>
      <span className="text-[11px] leading-4 font-semibold whitespace-nowrap text-ink">{top}</span>
      {chip}
    </div>
  );
  return (
    <Frame className="px-3">
      <div className="mx-auto flex w-[min(100%,20rem)] items-center gap-1">
        {step(<ScheduleIcon />, "brand", "Tue 9 AM", <Chip>Booked</Chip>)}
        {arrow}
        {step(<EstimatesIcon />, "sky", "$480", <Chip tone="done">Approved</Chip>)}
        {arrow}
        {step(
          <InvoicesIcon />,
          "emerald",
          "$480",
          <Chip tone="done">
            <CheckIcon className="size-2.5" />
            Paid
          </Chip>,
        )}
      </div>
    </Frame>
  );
}

function SocialArt() {
  const post = (gradient: string, chip: ReactNode) => (
    <div className={cx(card, "flex w-[4.75rem] flex-col gap-1.5 p-1.5")}>
      <span className={cx("block aspect-square rounded-xl", gradient)} />
      {chip}
    </div>
  );
  return (
    <Frame>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-start gap-2">
          {post("bg-[linear-gradient(140deg,#fde68a,#fca5a5)]", <Chip tone="done">Approved</Chip>)}
          {post("bg-[linear-gradient(140deg,#bfdbfe,#c4b5fd)]", <Chip tone="pending">Draft</Chip>)}
          {post("bg-[linear-gradient(140deg,#99f6e4,#bae6fd)]", <Chip tone="pending">Draft</Chip>)}
        </div>
        <span
          className={cx(
            card,
            "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-ink",
          )}
        >
          <StarIcon className="size-3.5 text-amber-500" />
          Review us on Google
        </span>
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
    case "website":
      return <WebsiteArt />;
    case "clients":
      return <ClientsArt />;
    case "money":
      return <MoneyArt />;
    case "social":
      return <SocialArt />;
    case "help":
      return <HelpArt />;
  }
}
