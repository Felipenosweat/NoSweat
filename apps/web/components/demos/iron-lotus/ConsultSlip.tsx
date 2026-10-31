"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ARTISTS, type ArtistId } from "./content";
import type { FlashPick } from "./FlashSheet";

// Ficha de consulta feita como a ficha de balcão de um estúdio (o "flash order slip"): seis
// campos numerados (lugar do corpo, tamanho, tipo de trabalho, artista, a ideia com uma imagem
// de referência opcional, e quem é a pessoa + 18 anos). Enquanto a pessoa preenche, o "price
// guide" no pé da ficha mostra SÓ o que a fixture diz sobre aquele caso (preço, depósito,
// sessão de dia inteiro, quem faz o quê). É DEMONSTRAÇÃO: nada é enviado, e a imagem escolhida
// nunca sai do navegador (URL.createObjectURL, desfeita ao trocar ou sair). Isso está escrito
// antes, durante e depois.
// Recebe "il:flash" (peça circulada na folha do topo) e "il:artist" (botão "Ask Mara").

const PLACEMENTS = [
  "Forearm",
  "Upper arm",
  "Hand",
  "Chest",
  "Ribs",
  "Back",
  "Thigh",
  "Calf",
  "Ankle",
  "Somewhere else",
] as const;

const SIZES = [
  { id: "coin", label: "Coin", hint: "under 2 in" },
  { id: "palm", label: "Palm", hint: "2–4 in" },
  { id: "hand", label: "Hand", hint: "4–7 in" },
  { id: "large", label: "Sleeve or back", hint: "bigger" },
] as const;

const KINDS = [
  { id: "custom", label: "Custom drawing" },
  { id: "fine", label: "Fine line or script" },
  { id: "cover", label: "Cover-up or rework" },
  { id: "flash", label: "Flash from the sheet" },
] as const;

type SizeId = (typeof SIZES)[number]["id"];
type KindId = (typeof KINDS)[number]["id"];
type ArtistChoice = ArtistId | "any";
type FieldKey = "placement" | "size" | "kind" | "artist" | "idea" | "you";

const FIELD_LABEL: Record<FieldKey, string> = {
  placement: "Placement",
  size: "Size",
  kind: "Kind of work",
  artist: "Artist",
  idea: "Your idea",
  you: "Name, contact and age",
};

function guide(kind: KindId | "", size: SizeId | "", artist: ArtistChoice | ""): string[] {
  const lines: string[] = [];
  if (kind === "custom")
    lines.push("Custom: $180 an hour, starting with a consult and a drawing session.");
  if (kind === "fine") lines.push("Fine line & script: from $150. Most pieces take 1–2 hours.");
  if (kind === "cover") lines.push("Cover-ups & reworks: a free consult first, then $180 an hour.");
  if (kind === "flash")
    lines.push(
      "Flash Fridays: walk in on a Friday and pick from the flash, from $100, first come. Flash as drawn needs no slip.",
    );
  if (size === "large" && kind !== "flash")
    lines.push("Sleeves and back pieces can go in full-day sessions: $1,100 for up to 6 hours.");
  if (kind === "fine" && artist && artist !== "theo" && artist !== "any")
    lines.push("Theo Banks is the one who does fine line and script.");
  if (kind === "cover" && artist && artist !== "lena" && artist !== "any")
    lines.push("Lena Ruiz is the one who does cover-ups and reworks.");
  if (kind && kind !== "flash")
    lines.push("A $100 deposit holds your date and comes off the price of your last session.");
  return lines;
}

function Row({
  n,
  legend,
  id,
  invalid,
  children,
  hint,
}: {
  n: number;
  legend: string;
  id: string;
  invalid: boolean;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      className="il-slip-row"
      data-invalid={invalid || undefined}
    >
      <legend className="il-slip-legend">
        <span className="il-slip-n" aria-hidden="true">
          {n}
        </span>
        <span className="il-mono text-[12px] tracking-[0.1em] uppercase">{legend}</span>
        {invalid ? (
          <span className="il-mono ml-auto text-[11px] tracking-[0.06em] text-[var(--il-red)] uppercase">
            Needed
          </span>
        ) : null}
      </legend>
      {hint ? <p className="mb-3 text-[14px] text-[var(--il-ink-soft)]">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

function Option({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="il-opt">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{children}</span>
    </label>
  );
}

export function ConsultSlip() {
  const id = useId();
  const [slipNo, setSlipNo] = useState("");
  const [placement, setPlacement] = useState("");
  const [placementOther, setPlacementOther] = useState("");
  const [size, setSize] = useState<SizeId | "">("");
  const [kind, setKind] = useState<KindId | "">("");
  const [artist, setArtist] = useState<ArtistChoice | "">("");
  const [idea, setIdea] = useState("");
  const [flash, setFlash] = useState<FlashPick | null>(null);
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<FieldKey[]>([]);
  const [done, setDone] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFlash = (event: Event) => {
      const detail = (event as CustomEvent<FlashPick>).detail;
      setFlash(detail);
      setKind((value) => value || "flash");
      setDone(false);
    };
    const onArtist = (event: Event) => {
      setArtist((event as CustomEvent<ArtistId>).detail);
      setDone(false);
    };
    window.addEventListener("il:flash", onFlash);
    window.addEventListener("il:artist", onArtist);
    return () => {
      window.removeEventListener("il:flash", onFlash);
      window.removeEventListener("il:artist", onArtist);
    };
  }, []);

  // A imagem de referência fica só na memória da aba; libera ao trocar ou sair.
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.url);
    };
  }, [image]);

  const lines = guide(kind, size, artist);

  const check = (): FieldKey[] => {
    const missing: FieldKey[] = [];
    if (!placement || (placement === "Somewhere else" && !placementOther.trim()))
      missing.push("placement");
    if (!size) missing.push("size");
    if (!kind) missing.push("kind");
    if (!artist) missing.push("artist");
    if (!idea.trim() && !flash) missing.push("idea");
    if (!name.trim() || !contact.trim() || !adult) missing.push("you");
    return missing;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = check();
    setErrors(missing);
    if (missing.length) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    // O número da ficha nasce ao entregar (como o carimbo do balcão), só no navegador.
    setSlipNo((value) => value || String(1000 + Math.floor(Math.random() * 9000)));
    setDone(true);
    requestAnimationFrame(() => doneHeading.current?.focus());
  };

  const reset = () => {
    setPlacement("");
    setPlacementOther("");
    setSize("");
    setKind("");
    setArtist("");
    setIdea("");
    setFlash(null);
    setImage(null);
    setName("");
    setContact("");
    setAdult(false);
    setErrors([]);
    setDone(false);
    setSlipNo("");
  };

  const invalid = (key: FieldKey) => errors.includes(key);
  const artistName =
    artist === "any" ? "Not sure yet" : ARTISTS.find((item) => item.id === artist)?.name;
  const sizeLabel = SIZES.find((item) => item.id === size);

  if (done) {
    return (
      <div className="il-slip il-stub" role="status">
        <div className="il-slip-head">
          <span className="il-mono text-[12px] tracking-[0.1em] uppercase">
            Carbon copy · Slip No. {slipNo}
          </span>
          <span className="il-stamp-sm">Not sent</span>
        </div>
        <h3
          ref={doneHeading}
          tabIndex={-1}
          className="il-display mt-6 text-[clamp(2.2rem,4vw,3.4rem)] leading-[0.9] uppercase outline-none"
        >
          Slip filled in{name ? `, ${name.trim().split(" ")[0]}` : ""}.
        </h3>
        <dl className="il-mono mt-6 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[9rem_1fr]">
          <dt className="text-[var(--il-ink-soft)] uppercase">Placement</dt>
          <dd>{placement === "Somewhere else" ? placementOther : placement}</dd>
          <dt className="text-[var(--il-ink-soft)] uppercase">Size</dt>
          <dd>
            {sizeLabel?.label} ({sizeLabel?.hint})
          </dd>
          <dt className="text-[var(--il-ink-soft)] uppercase">Work</dt>
          <dd>{KINDS.find((item) => item.id === kind)?.label}</dd>
          <dt className="text-[var(--il-ink-soft)] uppercase">Artist</dt>
          <dd>{artistName}</dd>
          <dt className="text-[var(--il-ink-soft)] uppercase">Reference</dt>
          <dd>
            {flash ? `Flash No. ${flash.no}, ${flash.name}. ` : ""}
            {idea.trim()}
            {image ? ` (image: ${image.name}, kept on this page)` : ""}
          </dd>
        </dl>
        <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.6]">
          This is a demonstration: nothing was sent, and no file left this page. At Iron Lotus a
          consult comes first, and a $100 deposit holds your date. Bring a valid photo ID on the
          day.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="il-btn il-btn-ink">
            Start a new slip
          </button>
          <button type="button" onClick={() => setDone(false)} className="il-btn il-btn-line">
            Edit this slip
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="il-slip" onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <div className="il-slip-head">
        <h3 id={`${id}-title`} className="il-mono text-[12px] tracking-[0.1em] uppercase">
          Iron Lotus Tattoo · Consult slip{" "}
          <span className="text-[var(--il-ink-soft)]">No. {slipNo || "____"}</span>
        </h3>
        <span className="il-stamp-sm">Demo · sends nothing</span>
      </div>

      {errors.length ? (
        <div ref={summary} tabIndex={-1} role="alert" className="il-slip-errors mt-5 outline-none">
          <p className="font-semibold">A few lines are still empty:</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {errors.map((key) => (
              <li key={key}>
                <a href={`#${id}-${key}`} className="il-link">
                  {FIELD_LABEL[key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Row n={1} legend="Placement" id={`${id}-placement`} invalid={invalid("placement")}>
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map((item) => (
            <Option
              key={item}
              name={`${id}-placement-r`}
              value={item}
              checked={placement === item}
              onChange={() => setPlacement(item)}
            >
              {item}
            </Option>
          ))}
        </div>
        {placement === "Somewhere else" ? (
          <label className="mt-4 block">
            <span className="il-mono text-[11px] tracking-[0.08em] text-[var(--il-ink-soft)] uppercase">
              Where?
            </span>
            <input
              type="text"
              value={placementOther}
              onChange={(event) => setPlacementOther(event.target.value)}
              className="il-field"
            />
          </label>
        ) : null}
      </Row>

      <Row n={2} legend="Size" id={`${id}-size`} invalid={invalid("size")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SIZES.map((item) => (
            <Option
              key={item.id}
              name={`${id}-size-r`}
              value={item.id}
              checked={size === item.id}
              onChange={() => setSize(item.id)}
            >
              <span className="block font-semibold">{item.label}</span>
              <span className="il-mono block text-[11px] opacity-80">{item.hint}</span>
            </Option>
          ))}
        </div>
      </Row>

      <Row n={3} legend="Kind of work" id={`${id}-kind`} invalid={invalid("kind")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((item) => (
            <Option
              key={item.id}
              name={`${id}-kind-r`}
              value={item.id}
              checked={kind === item.id}
              onChange={() => setKind(item.id)}
            >
              {item.label}
            </Option>
          ))}
        </div>
      </Row>

      <Row n={4} legend="Artist" id={`${id}-artist`} invalid={invalid("artist")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {ARTISTS.map((item) => (
            <Option
              key={item.id}
              name={`${id}-artist-r`}
              value={item.id}
              checked={artist === item.id}
              onChange={() => setArtist(item.id)}
            >
              <span className="block font-semibold">{item.name}</span>
              <span className="il-mono block text-[11px] opacity-80">
                {item.styles.join(" & ")}
              </span>
            </Option>
          ))}
          <Option
            name={`${id}-artist-r`}
            value="any"
            checked={artist === "any"}
            onChange={() => setArtist("any")}
          >
            <span className="block font-semibold">Not sure yet</span>
            <span className="il-mono block text-[11px] opacity-80">match me at the consult</span>
          </Option>
        </div>
      </Row>

      <Row
        n={5}
        legend="Your idea"
        id={`${id}-idea`}
        invalid={invalid("idea")}
        hint="Describe it the way you would at the counter: what, how big, any words or dates."
      >
        {flash ? (
          <p className="il-mono mb-3 inline-flex items-center gap-3 border border-[var(--il-red)] px-3 py-1.5 text-[12px] tracking-[0.06em] text-[var(--il-red)] uppercase">
            Flash No. {flash.no} · {flash.name}
            <button
              type="button"
              onClick={() => setFlash(null)}
              className="il-x"
              aria-label={`Remove flash No. ${flash.no} from the slip`}
            >
              ×
            </button>
          </p>
        ) : null}
        <label className="block">
          <span className="sr-only">Describe your idea</span>
          <textarea
            rows={3}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            className="il-field resize-y"
            placeholder="A lotus with a dagger through it, inner forearm, black and red…"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="il-btn il-btn-line cursor-pointer">
            <input
              ref={file}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                if (chosen) setImage({ url: URL.createObjectURL(chosen), name: chosen.name });
                event.target.value = "";
              }}
            />
            {image ? "Choose another image" : "Add a reference image"}
          </label>
          {image ? (
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), nunca enviada */}
              <img
                src={image.url}
                alt={`Your reference image, ${image.name}`}
                className="size-14 border border-[var(--il-ink)] object-cover"
              />
              <button
                type="button"
                className="il-link text-[14px]"
                onClick={() => {
                  setImage(null);
                  file.current?.focus();
                }}
              >
                Remove
              </button>
            </span>
          ) : null}
          <span className="il-mono text-[11px] tracking-[0.04em] text-[var(--il-ink-soft)]">
            The image stays in this browser tab. Nothing is uploaded.
          </span>
        </div>
      </Row>

      <Row n={6} legend="You" id={`${id}-you`} invalid={invalid("you")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="il-mono text-[11px] tracking-[0.08em] text-[var(--il-ink-soft)] uppercase">
              Name
            </span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="il-field"
            />
          </label>
          <label className="block">
            <span className="il-mono text-[11px] tracking-[0.08em] text-[var(--il-ink-soft)] uppercase">
              Email or phone
            </span>
            <input
              type="text"
              autoComplete="email"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="il-field"
            />
          </label>
        </div>
        <label className="il-check mt-5">
          <input
            type="checkbox"
            checked={adult}
            onChange={(event) => setAdult(event.target.checked)}
          />
          <span>I&apos;m 18 or older and will bring a valid photo ID.</span>
        </label>
      </Row>

      <div className="il-guide" aria-live="polite">
        <p className="il-mono text-[11px] tracking-[0.1em] uppercase">Price guide</p>
        {lines.length ? (
          <ul className="mt-2 grid gap-1.5 text-[15px] leading-snug">
            {lines.map((text) => (
              <li key={text} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--il-red)]">
                  —
                </span>
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px] leading-snug text-[var(--il-ink-soft)]">
            Pick the kind of work and the studio&apos;s prices for it show up here.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" className="il-btn il-btn-red">
          Tear off &amp; hand in
        </button>
        <p className="text-[13px] text-[var(--il-ink-soft)]">
          Demonstration only. Nothing is sent or stored.
        </p>
      </div>
    </form>
  );
}
