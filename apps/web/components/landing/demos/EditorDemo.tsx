import Image from "next/image";
import { StatusBadge } from "@/components/DashboardUi";
import { SparklesIcon } from "@/components/marketing/icons";
import { STYLE_PRESETS } from "@/app/sites/[id]/edit/presets";

// Cena "Edit": o painel do editor (/sites/[id]/edit) com as mesmas abas e rótulos de verdade
// (Ask AI, Content, Style, Sections; "Upload your own"; "Ready-made styles"; "Fonts"). Cada
// batida da rolagem mostra uma camada (classes `st-e-*`, ver landing.css): editar um texto,
// pedir à IA, trocar a foto, mudar o estilo. Conteúdo de exemplo da Sparkle & Co. Cleaning.

const TABS = [
  { id: "ai", label: "Ask AI" },
  { id: "content", label: "Content" },
  { id: "style", label: "Style" },
  { id: "sections", label: "Sections" },
] as const;

/** O estilo atual do exemplo (verde-petróleo) e o que o dono escolhe na última batida. */
const BEFORE = STYLE_PRESETS.find((preset) => preset.id === "slate");
const AFTER = STYLE_PRESETS.find((preset) => preset.id === "harbor");

const fieldLabel = "text-[11px] font-semibold text-slate-600";
const fieldBox =
  "mt-1 rounded-lg bg-white px-2.5 py-1.5 text-[13px] leading-snug text-ink ring-1 ring-slate-200";

/** As quatro bolinhas de cor de um estilo pronto (como no painel Style). */
function Swatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex gap-1">
      {colors.map((color, index) => (
        <span
          key={`${index}-${color}`}
          className="size-3.5 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

function StyleTile({
  name,
  colors,
  className = "",
}: {
  name: string;
  colors: string[];
  className?: string;
}) {
  return (
    <span
      className={`relative flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2 ${className}`}
    >
      <Swatches colors={colors} />
      <span className="truncate text-[11px] font-semibold text-ink">{name}</span>
    </span>
  );
}

export function EditorPanel() {
  const themeColors = (preset: (typeof STYLE_PRESETS)[number] | undefined) =>
    preset
      ? [preset.theme.primary, preset.theme.secondary, preset.theme.background, preset.theme.text]
      : [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-ink shadow-[0_30px_60px_-24px_rgb(7_27_51/.55)] sm:p-3">
      <div className="grid grid-cols-4 gap-0.5 rounded-lg bg-slate-100 p-0.5">
        {TABS.map((tab) => (
          <span
            key={tab.id}
            className={`st-tab st-tab-${tab.id} relative truncate rounded-md px-1 py-1 text-center text-[11px] font-semibold text-slate-600`}
          >
            <span className="relative">{tab.label}</span>
          </span>
        ))}
      </div>

      <div className="mt-2.5 grid">
        {/* 0. Content: o texto do topo, aberto ao clicar na seção. */}
        <div className="st-e-layer st-e-l0 col-start-1 row-start-1">
          <p className={fieldLabel}>Headline</p>
          <p className={`${fieldBox} ring-2 ring-brand`}>
            A Spotless Home Without Lifting a Finger
          </p>
          <p className={`mt-2 ${fieldLabel}`}>Button</p>
          <p className={fieldBox}>Get a Cleaning Quote</p>
        </div>

        {/* 1. Ask AI: o pedido vira um rascunho novo. */}
        <div className="st-e-layer st-e-l1 col-start-1 row-start-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <SparklesIcon className="size-3.5 text-brand" />
            Describe a change
          </p>
          <p className={fieldBox}>Add Saturday hours, 9 to 2.</p>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
            <StatusBadge tone="draft">Draft</StatusBadge>
            Done. New draft ready to review.
          </p>
        </div>

        {/* 2. Content: a foto do topo, trocada por uma do dono. */}
        <div className="st-e-layer st-e-l2 col-start-1 row-start-1">
          <p className={fieldLabel}>Photo</p>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="relative block aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
              <Image
                src="/photos/crew.webp"
                alt=""
                fill
                sizes="64px"
                quality={60}
                className="object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold">our-crew.jpg</span>
              <span className="mt-1 inline-flex h-7 items-center rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold">
                Upload your own
              </span>
            </span>
          </div>
        </div>

        {/* 3. Style: um estilo pronto (cores + fontes). */}
        <div className="st-e-layer st-e-l3 col-start-1 row-start-1">
          <p className={fieldLabel}>Ready-made styles</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <StyleTile name={BEFORE?.name ?? "Clean slate"} colors={themeColors(BEFORE)} />
            <StyleTile
              name={AFTER?.name ?? "Harbor"}
              colors={themeColors(AFTER)}
              className="border-brand ring-1 ring-brand"
            />
          </div>
          <p className="mt-2 truncate text-[11px] text-slate-600">
            <span className="font-semibold text-ink">Fonts</span> · Plus Jakarta Sans + Inter
          </p>
        </div>
      </div>
    </div>
  );
}
