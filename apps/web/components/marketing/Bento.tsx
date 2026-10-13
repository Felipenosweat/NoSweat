import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { ArrowPathIcon, ArrowUturnLeftIcon, CheckIcon, EnvelopeIcon, SparklesIcon } from "./icons";
import { captionClass, panelTitleClass } from "./styles";

// "What you get": recortes da interface do app recriados em JSX (não são capturas).
// Cada mini-UI é ilustrativa (aria-hidden); o título e a legenda de cada cartão descrevem o
// recurso em texto. Dados de exemplo são de negócios fictícios e aparecem rotulados.

/** Cartão do bento: mini-UI em cima, título 15px + legenda 13px embaixo. */
function Tile({
  title,
  caption,
  children,
  className = "",
  index,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  className?: string;
  /** Posição no escalonamento da revelação (0–3). */
  index: number;
}) {
  return (
    <li
      className={`ns-reveal flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}
      style={{ "--ns-i": Math.min(index, 3) } as CSSProperties}
    >
      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <h3 className={`mt-6 ${panelTitleClass}`}>{title}</h3>
      <p className={`mt-1 max-w-[52ch] ${captionClass}`}>{caption}</p>
    </li>
  );
}

/** Selo neutro de status (o mesmo do app): ponto estático + rótulo. */
function StatusBadge({ label, dot }: { label: string; dot: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-lg bg-white px-2 text-xs font-medium text-ink ring-1 ring-slate-200">
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/** Botão "de mentira" dentro dos mini-UIs: mesmo visual do app, sem ser interativo. */
function FakeButton({
  children,
  tone = "secondary",
}: {
  children: ReactNode;
  tone?: "secondary" | "ink";
}) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold ${
        tone === "ink" ? "bg-ink text-white" : "border border-slate-300 bg-white text-ink"
      }`}
    >
      {children}
    </span>
  );
}

function AiEditMock() {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-surface">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className={panelTitleClass}>Ask AI</p>
        <StatusBadge label="Draft" dot="bg-slate-400" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Pedido do dono */}
        <div className="ml-auto max-w-[85%] rounded-xl rounded-br-lg bg-white px-4 py-3 text-[15px] leading-snug text-ink ring-1 ring-slate-200">
          Add a move-out cleaning service and make the headline warmer.
        </div>
        {/* Resumo devolvido pela IA */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <p className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-600">
            <SparklesIcon className="size-4 text-brand" />
            New draft · 2 changes
          </p>
          <ul className="divide-y divide-slate-200 text-[15px]">
            <li className="px-4 py-3">
              <p className="text-[13px] font-medium text-slate-500">Headline</p>
              <p className="mt-1 text-slate-500 line-through decoration-slate-400">
                Professional cleaning services in Worcester
              </p>
              <p className="mt-0.5 font-medium text-ink">
                A cleaner home, without giving up your Saturday
              </p>
            </li>
            <li className="px-4 py-3">
              <p className="text-[13px] font-medium text-slate-500">Services</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-ink">
                <span className="inline-flex size-5 items-center justify-center rounded-md bg-emerald-50 text-xs font-semibold text-emerald-700">
                  +
                </span>
                Move-out cleaning
              </p>
            </li>
          </ul>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-slate-500">Not live until you publish.</p>
          <FakeButton>
            <ArrowUturnLeftIcon className="size-3.5" />
            Undo
          </FakeButton>
        </div>
      </div>
    </div>
  );
}

function PhoneMock() {
  // Alvo da anotação: a borda direita do botão de ligar do topo (~96% × 8.6% da captura).
  const target = { x: 96, y: 8.6 };
  return (
    <div className="flex flex-1 items-start pt-2 sm:justify-center">
      <div className="relative">
        <div className="w-[190px] overflow-hidden rounded-xl border-[6px] border-ink bg-ink">
          <Image
            src="/shots/joes-plumbing-phone.webp"
            alt=""
            width={780}
            height={1688}
            sizes="190px"
            className="block h-auto w-full"
          />
        </div>
        {/* Camada alinhada com a imagem (dentro da moldura de 6px). */}
        <div className="pointer-events-none absolute inset-[6px]">
          <span
            className="absolute h-px bg-slate-300"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `calc(${100 - target.x}% + 6px + 1rem)`,
            }}
          />
          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-slate-400"
            style={{ left: `${target.x}%`, top: `calc(${target.y}% + 0.5px)` }}
          />
          <span
            className="absolute -translate-y-1/2 pl-1.5 text-[13px] font-medium whitespace-nowrap text-slate-600"
            style={{ left: "calc(100% + 6px + 1rem)", top: `${target.y}%` }}
          >
            Tap to call
          </span>
        </div>
      </div>
    </div>
  );
}

function LeadsMock() {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className={panelTitleClass}>Messages</p>
        <span className="inline-flex h-6 items-center rounded-lg bg-surface px-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          Example
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold text-ink">Dana M.</p>
          <p className="text-xs text-slate-500 tabular-nums">9:41 AM</p>
        </div>
        <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-slate-600">
          Water heater is leaking in the garage. Can someone come by Thursday morning?
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <EnvelopeIcon className="size-3.5" />
          Also sent to your email
        </p>
      </div>
    </div>
  );
}

function DomainMock() {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <p className={`truncate ${panelTitleClass}`}>yourbusiness.com</p>
        <StatusBadge label="Connected" dot="bg-emerald-500" />
      </div>
      <table className="w-full text-left text-[13px]">
        <thead className="text-slate-500">
          <tr>
            <th className="px-4 pt-3 pb-1 font-medium">Type</th>
            <th className="px-2 pt-3 pb-1 font-medium">Name</th>
            <th className="px-4 pt-3 pb-1 font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs text-ink">
          <tr>
            <td className="px-4 py-1.5">A</td>
            <td className="px-2 py-1.5">@</td>
            <td className="px-4 py-1.5">76.76.21.21</td>
          </tr>
          <tr>
            <td className="px-4 pt-1.5 pb-3">CNAME</td>
            <td className="px-2 pt-1.5 pb-3">www</td>
            <td className="truncate px-4 pt-1.5 pb-3">cname.vercel-dns.com</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Três pares reais do editor (os mesmos dos exemplos). As fontes só baixam quando o cartão
// chega perto da tela (a seção usa content-visibility).
const FONT_SAMPLES = [
  {
    name: "Joe’s Plumbing",
    pair: "Plus Jakarta Sans + Inter",
    heading: "var(--ns-font-modern-heading)",
    active: false,
  },
  {
    name: "Glow Salon",
    pair: "Playfair Display + Lora",
    heading: "var(--ns-font-classic-heading)",
    active: true,
  },
  {
    name: "Rosa’s Kitchen",
    pair: "Fredoka + Nunito",
    heading: "var(--ns-font-friendly-heading)",
    active: false,
  },
];

function StyleMock() {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className={panelTitleClass}>Style</p>
        <FakeButton>
          <ArrowPathIcon className="size-3.5" />
          Shuffle
        </FakeButton>
      </div>
      <ul className="grid grid-cols-1 gap-1 p-2">
        {FONT_SAMPLES.map((sample) => (
          <li
            key={sample.pair}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
              sample.active ? "bg-surface ring-1 ring-slate-200" : ""
            }`}
          >
            <span className="min-w-0">
              <span
                className="block truncate text-lg leading-tight text-ink"
                style={{ fontFamily: sample.heading }}
              >
                {sample.name}
              </span>
              <span className="block truncate text-xs text-slate-500">{sample.pair}</span>
            </span>
            {sample.active && <CheckIcon className="size-4 shrink-0 text-brand" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bento() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <Tile
        index={0}
        className="lg:col-span-7 lg:row-span-2"
        title="Ask for changes in plain English"
        caption="Describe the change and get a new draft with a summary of what changed. Undo it, or keep editing by hand."
      >
        <AiEditMock />
      </Tile>
      <Tile
        index={1}
        className="lg:col-span-5 lg:row-span-2"
        title="Made for phones, with tap to call"
        caption="Every template works on a phone, and visitors can call you with one tap. Example: a fictional plumber."
      >
        <PhoneMock />
      </Tile>
      <Tile
        index={2}
        className="lg:col-span-4"
        title="Requests in your inbox"
        caption="Contact-form requests arrive by email and are saved in your dashboard."
      >
        <LeadsMock />
      </Tile>
      <Tile
        index={3}
        className="lg:col-span-4"
        title="Your own domain"
        caption="On Pro and Premium. We show the two DNS records to add and check the connection."
      >
        <DomainMock />
      </Tile>
      <Tile
        index={3}
        className="lg:col-span-4"
        title="Ten font pairings"
        caption="Pick a font pairing and your colors in the editor. The change applies to the whole site."
      >
        <StyleMock />
      </Tile>
    </ul>
  );
}
