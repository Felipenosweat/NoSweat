"use client";

import type { SiteSpec } from "@nosweat/schema";
import { useId, type ReactNode } from "react";
import { LINK_KEYS, LINK_LABELS, withHttps, type LinkKey } from "./clean";
import { Field, ItemList } from "./fields";
import { inputClass, panelTitle } from "./ui";

type Update = (change: (draft: SiteSpec) => void) => void;

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-slate-200 px-5 py-6 last:border-b-0">
      <div>
        <h2 className={panelTitle}>{title}</h2>
        {note && <p className="mt-1 text-[13px] leading-snug text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Exemplo de cada link (só o formato; nada é preenchido sozinho). */
const LINK_PLACEHOLDERS: Record<LinkKey, string> = {
  booking: "https://yourbookingsite.com/yourbusiness",
  order: "https://order.yourbusiness.com",
  menu: "https://yourbusiness.com/menu",
  instagram: "@yourbusiness or full link",
  facebook: "https://facebook.com/yourbusiness",
  tiktok: "@yourbusiness or full link",
  google: "https://g.page/yourbusiness",
  yelp: "https://yelp.com/biz/yourbusiness",
  linkedin: "https://linkedin.com/company/yourbusiness",
};

/** Aba "Content": dados do negócio, links, horários e destaques (os selos do site). */
export function ContentPanel({
  business,
  update,
  nameError = null,
}: {
  business: SiteSpec["business"];
  update: Update;
  /** Aviso ao lado do nome (ex.: tentou salvar sem nome). */
  nameError?: string | null;
}) {
  const ids = useId();
  const nameErrorId = `${ids}-name-error`;

  function setLink(key: LinkKey, value: string) {
    update((d) => {
      const links = { ...d.business.links };
      links[key] = value;
      d.business.links = links;
    });
  }

  return (
    <div>
      <Group title="Business details" note="Shown in the header, contact section and footer.">
        <Field label="Business name">
          <input
            className={inputClass}
            value={business.name}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            onChange={(e) => update((d) => void (d.business.name = e.target.value))}
          />
          {nameError && (
            <span id={nameErrorId} className="mt-1.5 block text-[13px] font-medium text-red-700">
              {nameError}
            </span>
          )}
        </Field>
        <Field label="What you do">
          <input
            className={inputClass}
            maxLength={60}
            placeholder="e.g. Plumber, Hair salon"
            value={business.category ?? ""}
            onChange={(e) => update((d) => void (d.business.category = e.target.value))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              className={inputClass}
              type="tel"
              autoComplete="tel"
              value={business.phone ?? ""}
              onChange={(e) => update((d) => void (d.business.phone = e.target.value))}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={business.email ?? ""}
              onChange={(e) => update((d) => void (d.business.email = e.target.value))}
            />
          </Field>
          <Field label="City">
            <input
              className={inputClass}
              value={business.city ?? ""}
              onChange={(e) => update((d) => void (d.business.city = e.target.value))}
            />
          </Field>
          <Field label="State (2 letters)">
            <input
              className={inputClass}
              maxLength={2}
              value={business.state ?? ""}
              onChange={(e) => update((d) => void (d.business.state = e.target.value))}
            />
          </Field>
        </div>
        <Field label="Street address">
          <input
            className={inputClass}
            autoComplete="street-address"
            maxLength={120}
            placeholder="e.g. 2112 Logan Ave (leave empty if you go to customers)"
            value={business.address ?? ""}
            onChange={(e) => update((d) => void (d.business.address = e.target.value))}
          />
        </Field>
        <Field label="Service area">
          <input
            className={inputClass}
            maxLength={120}
            placeholder="e.g. Queens and Brooklyn"
            value={business.serviceArea ?? ""}
            onChange={(e) => update((d) => void (d.business.serviceArea = e.target.value))}
          />
        </Field>
      </Group>

      <Group
        title="Links"
        note="Only add links you own. Your main button opens the booking (or ordering) link; the others show in the footer."
      >
        {LINK_KEYS.map((key) => (
          <Field key={key} label={LINK_LABELS[key]}>
            <input
              className={inputClass}
              type="url"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={500}
              placeholder={LINK_PLACEHOLDERS[key]}
              value={business.links?.[key] ?? ""}
              onChange={(e) => setLink(key, e.target.value)}
              // Ao sair do campo, completa com https:// (o site só aceita links seguros).
              onBlur={(e) => {
                const fixed = withHttps(e.target.value, key);
                if (fixed !== e.target.value) setLink(key, fixed);
              }}
            />
          </Field>
        ))}
      </Group>

      <Group title="Hours">
        <ItemList
          items={business.hours ?? []}
          max={7}
          addLabel="Add hours"
          itemLabel="hours row"
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
                aria-label={`Days, row ${i + 1}`}
                maxLength={40}
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
                aria-label={`Hours, row ${i + 1}`}
                maxLength={40}
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
      </Group>

      <Group title="Highlights" note="Short badges near the top of your site.">
        <ItemList
          items={business.highlights ?? []}
          max={4}
          addLabel="Add highlight"
          itemLabel="highlight"
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
              aria-label={`Highlight ${i + 1}`}
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
      </Group>
    </div>
  );
}
