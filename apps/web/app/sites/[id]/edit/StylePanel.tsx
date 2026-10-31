"use client";

import {
  TemplateId,
  type Composition,
  type PrimaryAction,
  type SiteDesign,
  type SiteSpec,
  type Theme,
} from "@nosweat/schema";
import { useId, useState, type ReactNode } from "react";
import { FONT_OPTIONS, FontPicker } from "./FontPicker";
import { ShuffleIcon, UndoIcon } from "./icons";
import { matchingPreset, nextPreset, STYLE_PRESETS } from "./presets";
import { Field } from "./fields";
import { focusRing, inputClass, labelClass, panelTitle, secondaryButton, textButton } from "./ui";

type Update = (change: (draft: SiteSpec) => void) => void;

type ColorKey = "primary" | "secondary" | "background" | "text";

const COLORS: { key: ColorKey; label: string; hint: string }[] = [
  { key: "primary", label: "Main color", hint: "Buttons and key details" },
  { key: "secondary", label: "Accent color", hint: "Small highlights" },
  { key: "background", label: "Background", hint: "Behind everything" },
  { key: "text", label: "Text", hint: "Headings and body text" },
];

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "home-services": "Home services",
  beauty: "Beauty",
  restaurant: "Restaurant",
  professional: "Professional",
  portfolio: "Portfolio",
};

/** Uma opção de um seletor. `value: null` = "Automatic" (o campo sai do SiteSpec). */
type Choice<T extends string> = {
  value: T | null;
  label: string;
  hint?: string;
  /** Amostra visual pequena (ex.: o formato do botão). */
  sample?: ReactNode;
};

// Composições (arquitetura da página). Ver SiteDesign em packages/schema. Obrigatória: sem "Automatic".
const COMPOSITIONS: Choice<Composition>[] = [
  { value: "service-led", label: "Call-first", hint: "Phone always in view" },
  { value: "editorial", label: "Editorial", hint: "Big headline, numbered list" },
  { value: "immersive", label: "Photo-first", hint: "Full-width photo on top" },
  { value: "typographic", label: "Type-first", hint: "Bold type, no big photo" },
  { value: "modular", label: "Tiles", hint: "A grid of blocks" },
];

type HeaderStyle = NonNullable<SiteDesign["header"]>;
const HEADERS: Choice<HeaderStyle>[] = [
  { value: null, label: "Automatic", hint: "We pick one" },
  { value: "classic", label: "Classic", hint: "Name left, menu right" },
  { value: "centered", label: "Centered", hint: "Name in the middle" },
  { value: "bar", label: "Info bar", hint: "Hours and phone on top" },
  { value: "minimal", label: "Minimal", hint: "No menu, just call" },
];

/** Amostra do formato do botão (cores do app; a cor de verdade vem do tema do site). */
function ButtonSample({ shape }: { shape: NonNullable<SiteDesign["buttons"]> }) {
  const base = "inline-flex h-6 w-fit items-center px-2.5 text-[11px] font-semibold";
  const look = {
    pill: `${base} rounded-full bg-ink text-white`,
    sharp: `${base} rounded-none bg-ink text-white`,
    caps: `${base} rounded-[3px] bg-ink text-[10px] tracking-[0.08em] text-white uppercase`,
    line: "inline-flex h-6 w-fit items-center text-[11px] font-semibold text-ink underline underline-offset-4",
  } as const;
  return (
    <span aria-hidden="true" className={look[shape]}>
      Call
    </span>
  );
}

type ButtonShape = NonNullable<SiteDesign["buttons"]>;
const BUTTONS: Choice<ButtonShape>[] = [
  { value: null, label: "Automatic", hint: "We pick one" },
  { value: "pill", label: "Rounded", sample: <ButtonSample shape="pill" /> },
  { value: "sharp", label: "Square", sample: <ButtonSample shape="sharp" /> },
  { value: "caps", label: "All caps", sample: <ButtonSample shape="caps" /> },
  { value: "line", label: "Text link", sample: <ButtonSample shape="line" /> },
];

type ContactStyle = NonNullable<SiteDesign["contact"]>;
const CONTACTS: Choice<ContactStyle>[] = [
  { value: null, label: "Automatic", hint: "We pick one" },
  { value: "split", label: "Split", hint: "Dark panel, form beside" },
  { value: "stacked", label: "Stacked", hint: "Centered, form below" },
  { value: "letter", label: "Business card", hint: "Address and hours up big" },
];

type Density = NonNullable<SiteDesign["density"]>;
const DENSITIES: Choice<Density>[] = [
  { value: null, label: "Automatic" },
  { value: "airy", label: "Airy" },
  { value: "balanced", label: "Balanced" },
  { value: "compact", label: "Compact" },
];

type ImageTreatment = NonNullable<SiteDesign["imageTreatment"]>;
const IMAGE_TREATMENTS: Choice<ImageTreatment>[] = [
  { value: null, label: "Automatic" },
  { value: "natural", label: "Natural" },
  { value: "tinted", label: "Brand tint" },
  { value: "monochrome", label: "Black & white" },
];

// Ação principal do site (o botão grande do topo). "call" põe o telefone na frente.
const PRIMARY_ACTIONS: Choice<PrimaryAction>[] = [
  { value: null, label: "Automatic", hint: "Phone if you have one" },
  { value: "call", label: "Call", hint: "Your number up front" },
  { value: "quote", label: "Get a quote" },
  { value: "book", label: "Book" },
  { value: "visit", label: "Visit in person" },
  { value: "browse", label: "See your work" },
];

/** Direção de arte do rascunho, criada se faltar (composição obrigatória: "service-led"). */
function designOf(draft: SiteSpec): SiteDesign {
  const design: SiteDesign = draft.design ?? { composition: "service-led" };
  draft.design = design;
  return design;
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-b border-slate-200 px-5 py-6 last:border-b-0">
      <div>
        <h2 className={panelTitle}>{title}</h2>
        {note && <p className="mt-1 text-[13px] leading-snug text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

const tileClass =
  "flex min-h-11 cursor-pointer flex-col justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors duration-150 hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:ring-1 has-[:checked]:ring-brand has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand motion-reduce:transition-none";

const GRID_COLUMNS = { 2: "grid-cols-2", 3: "grid-cols-3" } as const;

/**
 * Seletor em blocos (rádios nativos escondidos): as setas do teclado trocam a opção e o Tab
 * entra e sai do grupo, como em qualquer grupo de rádios.
 */
function ChoicePicker<T extends string>({
  legend,
  choices,
  value,
  onChange,
  columns = 2,
}: {
  legend: string;
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  columns?: keyof typeof GRID_COLUMNS;
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className={labelClass}>{legend}</legend>
      <div className={`mt-1.5 grid gap-2 ${GRID_COLUMNS[columns]}`}>
        {choices.map((choice) => (
          <label key={choice.value ?? "auto"} className={tileClass}>
            <input
              type="radio"
              name={name}
              value={choice.value ?? "auto"}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.sample}
            <span className="min-w-0">
              <span className="block text-[13px] leading-tight font-semibold text-ink">
                {choice.label}
              </span>
              {choice.hint && (
                <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">
                  {choice.hint}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Amostra das 4 cores de um tema (só visual; o nome do estilo vem ao lado). */
function Swatches({ theme }: { theme: Theme }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-1">
      {[theme.primary, theme.secondary, theme.text, theme.background].map((color, index) => (
        <span
          key={index}
          className="size-5 rounded-full ring-2 ring-white outline outline-1 -outline-offset-1 outline-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** O campo de texto padrão, sem a margem de cima (fica ao lado do seletor de cor). */
const hexInputClass = inputClass.replace("mt-1.5 ", "");

/** "1d4ed8" ou "#1d4ed8" → "#1D4ED8"; `null` se ainda não é uma cor completa. */
function normalizeHex(raw: string): string | null {
  const text = raw.trim();
  const withHash = text.startsWith("#") ? text : `#${text}`;
  return HEX.test(withHash) ? withHash.toUpperCase() : null;
}

/** Contraste WCAG entre duas cores hex (1 a 21). */
function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const channel = (start: number) => {
      const c = parseInt(hex.slice(start, start + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Uma cor do tema: o seletor do navegador + o código hex, que também pode ser digitado. */
function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const ids = useId();
  const [text, setText] = useState(value);
  // A cor mudou por fora (seletor, estilo pronto, IA): o campo mostra a nova.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setText(value);
  }
  const invalid = normalizeHex(text) === null;

  return (
    <div>
      <p id={`${ids}-label`} className={labelClass}>
        {label}
      </p>
      <p className="text-[12px] text-slate-500">{hint}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          aria-labelledby={`${ids}-label`}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className={`size-11 shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 disabled:cursor-not-allowed lg:size-10 ${focusRing}`}
        />
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={7}
          aria-label={`${label} hex code`}
          aria-invalid={invalid || undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex && hex !== value.toUpperCase()) onChange(hex);
          }}
          // Código incompleto ao sair do campo: volta para a cor atual.
          onBlur={() => setText(value)}
          className={`${hexInputClass} min-w-0 flex-1 font-mono uppercase`}
        />
      </div>
    </div>
  );
}

/**
 * Aba "Style": estilos prontos (Shuffle), "Look" (composição, cabeçalho, botões, contato,
 * espaçamento, fotos e ação principal), cores (seletor + hex) e fontes.
 */
export function StylePanel({
  spec,
  update,
  themeBeforeShuffle,
  onShuffle,
  onUndoShuffle,
}: {
  spec: SiteSpec;
  update: Update;
  themeBeforeShuffle: Theme | null;
  onShuffle: (theme: Theme) => void;
  onUndoShuffle: () => void;
}) {
  const current = matchingPreset(spec.theme);
  const fontPair = FONT_OPTIONS.find((f) => f.id === spec.theme.font)?.pair;
  const design = spec.design;
  const lowContrast = contrastRatio(spec.theme.text, spec.theme.background) < 4.5;

  return (
    <div>
      <Group
        title="Style"
        note="Try a ready-made look: a font pairing and colors that work together."
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => onShuffle(nextPreset(spec.theme).theme)}
            className={secondaryButton}
          >
            <ShuffleIcon className="size-4" />
            Shuffle style
          </button>
          {themeBeforeShuffle && (
            <button
              type="button"
              onClick={onUndoShuffle}
              className={`${textButton} px-1 text-slate-700`}
            >
              <UndoIcon className="size-4" />
              Undo
            </button>
          )}
        </div>
        <p aria-live="polite" className="text-[13px] text-slate-600">
          {current ? (
            <>
              <span className="font-medium text-ink">{current.name}</span> · {fontPair}
            </>
          ) : (
            <>Your own colors · {fontPair}</>
          )}
        </p>

        <fieldset>
          <legend className={labelClass}>Ready-made styles</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className="flex min-h-11 cursor-pointer flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-colors duration-150 hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:ring-1 has-[:checked]:ring-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand motion-reduce:transition-none"
              >
                <input
                  type="radio"
                  name="style-preset"
                  value={preset.id}
                  checked={current?.id === preset.id}
                  onChange={() => onShuffle(preset.theme)}
                  className="sr-only"
                />
                <Swatches theme={preset.theme} />
                <span className="w-full min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {preset.name}
                  </span>
                  <span className="block truncate text-[12px] text-slate-500">{preset.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Group>

      <Group
        title="Look"
        note="How the page is put together. “Automatic” lets us pick what suits your business."
      >
        <ChoicePicker
          legend="Page layout"
          choices={COMPOSITIONS}
          value={design?.composition ?? "service-led"}
          onChange={(value) => {
            if (!value) return;
            const composition: Composition = value;
            // Só a composição muda: o resto do plano (referências, motivo) fica para depuração.
            update((d) => void (designOf(d).composition = composition));
          }}
        />
        <ChoicePicker
          legend="Header"
          choices={HEADERS}
          value={design?.header ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.header = value;
              else delete next.header;
            })
          }
        />
        <ChoicePicker
          legend="Button shape"
          choices={BUTTONS}
          columns={3}
          value={design?.buttons ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.buttons = value;
              else delete next.buttons;
            })
          }
        />
        <ChoicePicker
          legend="Main button"
          choices={PRIMARY_ACTIONS}
          value={design?.primaryAction ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.primaryAction = value;
              else delete next.primaryAction;
            })
          }
        />
        <ChoicePicker
          legend="Contact block"
          choices={CONTACTS}
          value={design?.contact ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.contact = value;
              else delete next.contact;
            })
          }
        />
        <ChoicePicker
          legend="Spacing"
          choices={DENSITIES}
          value={design?.density ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.density = value;
              else delete next.density;
            })
          }
        />
        <ChoicePicker
          legend="Photo style"
          choices={IMAGE_TREATMENTS}
          value={design?.imageTreatment ?? null}
          onChange={(value) =>
            update((d) => {
              const next = designOf(d);
              if (value) next.imageTreatment = value;
              else delete next.imageTreatment;
            })
          }
        />
        <Field label="Business type">
          <select
            className={inputClass}
            value={spec.template}
            onChange={(e) => update((d) => void (d.template = TemplateId.parse(e.target.value)))}
          >
            {TemplateId.options.map((template) => (
              <option key={template} value={template}>
                {TEMPLATE_LABELS[template]}
              </option>
            ))}
          </select>
        </Field>
      </Group>

      <Group title="Colors" note="Pick a color or type its hex code, like #1D4ED8.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {COLORS.map(({ key, label, hint }) => (
            <ColorField
              key={key}
              label={label}
              hint={hint}
              value={spec.theme[key]}
              onChange={(hex) => update((d) => void (d.theme[key] = hex))}
            />
          ))}
        </div>
        {lowContrast && (
          <p role="status" className="text-[13px] leading-snug text-amber-800">
            Your text and background colors are close. Some visitors may find the text hard to read.
          </p>
        )}
      </Group>

      <Group title="Font">
        <FontPicker
          value={spec.theme.font}
          onChange={(font) => update((d) => void (d.theme.font = font))}
        />
      </Group>
    </div>
  );
}
