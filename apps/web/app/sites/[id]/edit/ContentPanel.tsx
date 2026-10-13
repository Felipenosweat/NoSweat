"use client";

import type { SiteSpec } from "@nosweat/schema";
import type { ReactNode } from "react";
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

/** Aba "Content": dados do negócio, horários e destaques (os selos do site). */
export function ContentPanel({
  business,
  update,
}: {
  business: SiteSpec["business"];
  update: Update;
}) {
  return (
    <div>
      <Group title="Business details" note="Shown in the header, contact section and footer.">
        <Field label="Business name">
          <input
            className={inputClass}
            value={business.name}
            onChange={(e) => update((d) => void (d.business.name = e.target.value))}
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
        <Field label="Service area">
          <input
            className={inputClass}
            placeholder="e.g. Queens and Brooklyn"
            value={business.serviceArea ?? ""}
            onChange={(e) => update((d) => void (d.business.serviceArea = e.target.value))}
          />
        </Field>
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
