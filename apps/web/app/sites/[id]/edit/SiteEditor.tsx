"use client";

import {
  ApiError,
  SiteSpec,
  TemplateId,
  UpdateSiteResponse,
  AiEditResponse,
  type Section,
  type SectionType,
} from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MAX_ITEMS, newSection, SECTION_LABELS } from "./defaults";

type Theme = SiteSpec["theme"];
type Business = SiteSpec["business"];

const FONTS: { value: Theme["font"]; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "friendly", label: "Friendly" },
];

const COLORS: { key: "primary" | "secondary" | "background" | "text"; label: string }[] = [
  { key: "primary", label: "Main color" },
  { key: "secondary", label: "Accent color" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
];

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none";

/** Campos opcionais vazios saem do SiteSpec (ex.: e-mail "" não é um e-mail válido). */
function clean(spec: SiteSpec): SiteSpec {
  const business: Business = { name: spec.business.name.trim() };
  const optional = ["phone", "email", "city", "state", "serviceArea"] as const;
  for (const key of optional) {
    const value = spec.business[key]?.trim();
    if (value) business[key] = key === "state" ? value.toUpperCase() : value;
  }
  const hours = (spec.business.hours ?? [])
    .map((row) => ({ days: row.days.trim(), time: row.time.trim() }))
    .filter((row) => row.days || row.time);
  if (hours.length) business.hours = hours;
  const highlights = (spec.business.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  if (highlights.length) business.highlights = highlights;
  return { ...spec, business };
}

function describeError(path: PropertyKey[], message: string): string {
  const where = path
    .map((part) => (typeof part === "number" ? `#${part + 1}` : String(part)))
    .join(" › ");
  return where ? `${where}: ${message}` : message;
}

export function SiteEditor({ siteId, initialSpec }: { siteId: string; initialSpec: SiteSpec }) {
  const [spec, setSpec] = useState<SiteSpec>(initialSpec);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [newType, setNewType] = useState<SectionType>("faq");
  const [instruction, setInstruction] = useState("");
  const [aiPending, setAiPending] = useState(false);
  /** Versão anterior ao último pedido à IA, para o botão "Undo". */
  const [beforeAi, setBeforeAi] = useState<SiteSpec | null>(null);

  async function askAi() {
    setAiPending(true);
    setMessage(null);
    const previous = spec;
    try {
      const res = await fetch(`/api/sites/${siteId}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setMessage({
          kind: "error",
          text: apiError.success
            ? apiError.data.error.message
            : "The AI couldn't make that change.",
        });
        return;
      }
      const result = AiEditResponse.parse(body);
      setSpec(result.spec);
      setDirty(false);
      setBeforeAi(previous);
      setInstruction("");
      setMessage({
        kind: "ok",
        text: `${result.summary} Saved as a draft: check the preview, then publish it when you're happy.`,
      });
    } catch {
      setMessage({ kind: "error", text: "We couldn't reach our servers. Please try again." });
    } finally {
      setAiPending(false);
    }
  }

  function undoAi() {
    if (!beforeAi) return;
    setSpec(beforeAi);
    setBeforeAi(null);
    setDirty(true);
    setMessage({ kind: "ok", text: "Change undone. Click “Save changes” to keep it this way." });
  }

  /** Atualiza uma cópia do SiteSpec (nunca muta o estado atual). */
  function update(change: (draft: SiteSpec) => void) {
    setSpec((current) => {
      const draft = structuredClone(current);
      change(draft);
      return draft;
    });
    setDirty(true);
    setMessage(null);
  }

  function updateSection(index: number, change: (section: Section) => void) {
    update((draft) => {
      const section = draft.sections[index];
      if (section) change(section);
    });
  }

  function moveSection(index: number, delta: -1 | 1) {
    update((draft) => {
      const target = index + delta;
      const [section] = draft.sections.splice(index, 1);
      if (section) draft.sections.splice(target, 0, section);
    });
  }

  async function save() {
    const result = SiteSpec.safeParse(clean(spec));
    if (!result.success) {
      const issue = result.error.issues[0];
      setMessage({
        kind: "error",
        text: issue ? describeError(issue.path, issue.message) : "Please check your changes.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: result.data }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        setMessage({
          kind: "error",
          text: apiError.success ? apiError.data.error.message : "We couldn't save your changes.",
        });
        return;
      }
      setSpec(UpdateSiteResponse.parse(body).spec);
      setDirty(false);
      setMessage({
        kind: "ok",
        text: "Saved as a draft. Go back and click “Publish changes” to put it live.",
      });
    } catch {
      setMessage({ kind: "error", text: "We couldn't reach our servers. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const sectionCount = spec.sections.length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:h-screen">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/sites/${siteId}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Back
          </Link>
          <span className="truncate font-display font-bold">
            {spec.business.name || "Your website"}
          </span>
          {dirty && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </header>

      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`shrink-0 px-4 py-2 text-sm font-medium ${
            message.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[420px_1fr]">
        {/* Formulário */}
        <div className="space-y-4 overflow-y-auto p-4">
          <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
            <h2 className="text-sm font-bold tracking-wide text-sky-900 uppercase">✨ Ask AI</h2>
            <p className="text-xs text-sky-900/80">
              Tell us what to change, in your own words. Example: “Change my hours to Monday through
              Saturday, 8 AM to 6 PM.”
            </p>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={aiPending || dirty}
              placeholder="What would you like to change?"
              className={inputClass}
            />
            {dirty && (
              <p className="text-xs text-amber-700">Save your changes first, then ask the AI.</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={askAi}
                disabled={aiPending || dirty || instruction.trim().length < 3}
                className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {aiPending ? "Working on it..." : "Apply with AI"}
              </button>
              {beforeAi && !aiPending && (
                <button
                  type="button"
                  onClick={undoAi}
                  className="text-sm font-semibold text-slate-600 hover:underline"
                >
                  Undo
                </button>
              )}
            </div>
          </section>

          <Panel title="Business">
            <Field label="Business name">
              <input
                className={inputClass}
                value={spec.business.name}
                onChange={(e) => update((d) => void (d.business.name = e.target.value))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={spec.business.phone ?? ""}
                  onChange={(e) => update((d) => void (d.business.phone = e.target.value))}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  value={spec.business.email ?? ""}
                  onChange={(e) => update((d) => void (d.business.email = e.target.value))}
                />
              </Field>
              <Field label="City">
                <input
                  className={inputClass}
                  value={spec.business.city ?? ""}
                  onChange={(e) => update((d) => void (d.business.city = e.target.value))}
                />
              </Field>
              <Field label="State (2 letters)">
                <input
                  className={inputClass}
                  maxLength={2}
                  value={spec.business.state ?? ""}
                  onChange={(e) => update((d) => void (d.business.state = e.target.value))}
                />
              </Field>
            </div>
            <Field label="Service area">
              <input
                className={inputClass}
                placeholder="e.g. Queens and Brooklyn"
                value={spec.business.serviceArea ?? ""}
                onChange={(e) => update((d) => void (d.business.serviceArea = e.target.value))}
              />
            </Field>
          </Panel>

          <Panel title="Hours">
            <ItemList
              items={spec.business.hours ?? []}
              max={7}
              addLabel="Add hours"
              onAdd={() =>
                update((d) => {
                  d.business.hours = [...(d.business.hours ?? []), { days: "", time: "" }];
                })
              }
              onRemove={(i) => update((d) => void d.business.hours?.splice(i, 1))}
              render={(row, i) => (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    placeholder="Mon–Fri"
                    value={row.days}
                    onChange={(e) =>
                      update((d) => {
                        const target = d.business.hours?.[i];
                        if (target) target.days = e.target.value;
                      })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="8 AM – 6 PM"
                    value={row.time}
                    onChange={(e) =>
                      update((d) => {
                        const target = d.business.hours?.[i];
                        if (target) target.time = e.target.value;
                      })
                    }
                  />
                </div>
              )}
            />
          </Panel>

          <Panel title="Highlights (badges)">
            <ItemList
              items={spec.business.highlights ?? []}
              max={4}
              addLabel="Add highlight"
              note="Only list things that are true, like “Licensed & insured” or “Free estimates”."
              onAdd={() =>
                update((d) => {
                  d.business.highlights = [...(d.business.highlights ?? []), ""];
                })
              }
              onRemove={(i) => update((d) => void d.business.highlights?.splice(i, 1))}
              render={(item, i) => (
                <input
                  className={inputClass}
                  maxLength={40}
                  placeholder="Licensed & insured"
                  value={item}
                  onChange={(e) =>
                    update((d) => {
                      if (d.business.highlights) d.business.highlights[i] = e.target.value;
                    })
                  }
                />
              )}
            />
          </Panel>

          <Panel title="Design">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Template">
                <select
                  className={inputClass}
                  value={spec.template}
                  onChange={(e) =>
                    update((d) => void (d.template = TemplateId.parse(e.target.value)))
                  }
                >
                  {TemplateId.options.map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fonts">
                <select
                  className={inputClass}
                  value={spec.theme.font}
                  onChange={(e) => {
                    const font = FONTS.find((f) => f.value === e.target.value)?.value;
                    if (font) update((d) => void (d.theme.font = font));
                  }}
                >
                  {FONTS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={spec.theme[key]}
                      onChange={(e) =>
                        update((d) => void (d.theme[key] = e.target.value.toUpperCase()))
                      }
                      className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white"
                    />
                    <span className="font-mono text-xs text-slate-500">{spec.theme[key]}</span>
                  </div>
                </Field>
              ))}
            </div>
          </Panel>

          {spec.sections.map((section, index) => (
            <Panel
              key={index}
              title={SECTION_LABELS[section.type]}
              actions={
                <div className="flex gap-1">
                  <IconButton
                    label="Move up"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={index === sectionCount - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label="Remove section"
                    disabled={sectionCount <= 2}
                    onClick={() => update((d) => void d.sections.splice(index, 1))}
                  >
                    ✕
                  </IconButton>
                </div>
              }
            >
              <SectionFields
                section={section}
                onChange={(change) => updateSection(index, change)}
              />
            </Panel>
          ))}

          <Panel title="Add a section">
            <div className="flex gap-2">
              <select
                className={inputClass}
                value={newType}
                onChange={(e) => {
                  const type = (Object.keys(SECTION_LABELS) as SectionType[]).find(
                    (t) => t === e.target.value,
                  );
                  if (type) setNewType(type);
                }}
              >
                {(Object.keys(SECTION_LABELS) as SectionType[]).map((type) => (
                  <option key={type} value={type}>
                    {SECTION_LABELS[type]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={sectionCount >= 10}
                onClick={() => update((d) => void d.sections.push(newSection(newType)))}
                className="mt-1 shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </Panel>
        </div>

        {/* Prévia ao vivo. O transform faz os elementos "fixed" do site ficarem dentro da caixa. */}
        <div className="min-h-[70vh] overflow-y-auto border-l border-slate-200 bg-white [transform:translateZ(0)] lg:min-h-0">
          <SiteRenderer spec={spec} />
        </div>
      </div>
    </div>
  );
}

function SectionFields({
  section,
  onChange,
}: {
  section: Section;
  onChange: (change: (section: Section) => void) => void;
}) {
  switch (section.type) {
    case "hero":
      return (
        <>
          <Field label="Headline">
            <input
              className={inputClass}
              value={section.title}
              onChange={(e) =>
                onChange((s) => void (s.type === "hero" && (s.title = e.target.value)))
              }
            />
          </Field>
          <Field label="Subtitle">
            <textarea
              rows={3}
              className={inputClass}
              value={section.subtitle}
              onChange={(e) =>
                onChange((s) => void (s.type === "hero" && (s.subtitle = e.target.value)))
              }
            />
          </Field>
          <Field label="Button text">
            <input
              className={inputClass}
              value={section.ctaLabel}
              onChange={(e) =>
                onChange((s) => void (s.type === "hero" && (s.ctaLabel = e.target.value)))
              }
            />
          </Field>
        </>
      );

    case "services":
      return (
        <ItemList
          items={section.items}
          max={MAX_ITEMS.services}
          addLabel="Add service"
          onAdd={() =>
            onChange(
              (s) =>
                void (
                  s.type === "services" &&
                  s.items.push({ name: "New service", description: "Describe this service." })
                ),
            )
          }
          onRemove={(i) => onChange((s) => void (s.type === "services" && s.items.splice(i, 1)))}
          render={(item, i) => (
            <>
              <input
                className={inputClass}
                placeholder="Service name"
                value={item.name}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "services" ? s.items[i] : undefined;
                    if (target) target.name = e.target.value;
                  })
                }
              />
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Short description"
                value={item.description}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "services" ? s.items[i] : undefined;
                    if (target) target.description = e.target.value;
                  })
                }
              />
            </>
          )}
        />
      );

    case "testimonials":
      return (
        <ItemList
          items={section.items}
          max={MAX_ITEMS.testimonials}
          addLabel="Add review"
          note="Only use real reviews from real customers."
          onAdd={() =>
            onChange(
              (s) =>
                void (
                  s.type === "testimonials" &&
                  s.items.push({
                    quote: "Paste a real customer review here.",
                    author: "Customer name",
                  })
                ),
            )
          }
          onRemove={(i) =>
            onChange((s) => void (s.type === "testimonials" && s.items.splice(i, 1)))
          }
          render={(item, i) => (
            <>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="What the customer said"
                value={item.quote}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "testimonials" ? s.items[i] : undefined;
                    if (target) target.quote = e.target.value;
                  })
                }
              />
              <input
                className={inputClass}
                placeholder="Customer name"
                value={item.author}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "testimonials" ? s.items[i] : undefined;
                    if (target) target.author = e.target.value;
                  })
                }
              />
            </>
          )}
        />
      );

    case "faq":
      return (
        <ItemList
          items={section.items}
          max={MAX_ITEMS.faq}
          addLabel="Add question"
          onAdd={() =>
            onChange(
              (s) =>
                void (
                  s.type === "faq" &&
                  s.items.push({ q: "A question customers ask", a: "Your answer." })
                ),
            )
          }
          onRemove={(i) => onChange((s) => void (s.type === "faq" && s.items.splice(i, 1)))}
          render={(item, i) => (
            <>
              <input
                className={inputClass}
                placeholder="Question"
                value={item.q}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "faq" ? s.items[i] : undefined;
                    if (target) target.q = e.target.value;
                  })
                }
              />
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Answer"
                value={item.a}
                onChange={(e) =>
                  onChange((s) => {
                    const target = s.type === "faq" ? s.items[i] : undefined;
                    if (target) target.a = e.target.value;
                  })
                }
              />
            </>
          )}
        />
      );

    case "contact":
      return (
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.showForm}
              onChange={(e) =>
                onChange((s) => void (s.type === "contact" && (s.showForm = e.target.checked)))
              }
            />
            Show contact form (messages arrive in your dashboard)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.showMap}
              onChange={(e) =>
                onChange((s) => void (s.type === "contact" && (s.showMap = e.target.checked)))
              }
            />
            Show map area
          </label>
        </div>
      );

    default: {
      const unhandled: never = section;
      return unhandled;
    }
  }
}

function ItemList<T>({
  items,
  max,
  addLabel,
  note,
  onAdd,
  onRemove,
  render,
}: {
  items: T[];
  max: number;
  addLabel: string;
  note?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {note && <p className="text-xs text-amber-700">{note}</p>}
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg bg-slate-50 p-3">
          {render(item, index)}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        disabled={items.length >= max}
        className="text-sm font-semibold text-sky-700 hover:underline disabled:text-slate-400 disabled:no-underline"
      >
        + {addLabel} {items.length >= max && `(max ${max})`}
      </button>
    </div>
  );
}

function Panel({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide text-slate-700 uppercase">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-md text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
