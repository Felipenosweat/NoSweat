"use client";

import type { Section } from "@nosweat/schema";
import { MAX_ITEMS } from "./defaults";
import { Field, ItemList } from "./fields";
import { GalleryFields } from "./GalleryFields";
import { HeroPhotoField } from "./HeroPhotoField";
import { inputClass, textareaClass } from "./ui";

/** Campos de cada tipo de seção. `onChange` recebe uma função que altera uma cópia da seção. */
export function SectionFields({
  siteId,
  section,
  onChange,
}: {
  siteId: string;
  section: Section;
  onChange: (change: (section: Section) => void) => void;
}) {
  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-4">
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
              className={textareaClass}
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
          <HeroPhotoField
            siteId={siteId}
            image={section.image}
            suggestedQuery={section.imageQuery ?? ""}
            onChange={(image) =>
              onChange((s) => {
                if (s.type !== "hero") return;
                if (image) {
                  s.image = image;
                } else {
                  // Sem a busca, uma edição por IA não traz a foto de volta sozinha.
                  delete s.image;
                  delete s.imageQuery;
                }
              })
            }
          />
        </div>
      );

    case "services":
      return (
        <ItemList
          items={section.items}
          max={MAX_ITEMS.services}
          addLabel="Add service"
          itemLabel="service"
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
                aria-label={`Service ${i + 1} name`}
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
                className={textareaClass}
                aria-label={`Service ${i + 1} description`}
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
          itemLabel="review"
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
                className={textareaClass}
                aria-label={`Review ${i + 1} text`}
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
                aria-label={`Review ${i + 1} customer name`}
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
          itemLabel="question"
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
                aria-label={`Question ${i + 1}`}
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
                className={textareaClass}
                aria-label={`Answer ${i + 1}`}
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
        <div className="space-y-1 text-[15px] text-slate-700">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={section.showForm}
              onChange={(e) =>
                onChange((s) => void (s.type === "contact" && (s.showForm = e.target.checked)))
              }
              className="size-5 shrink-0 accent-brand"
            />
            Show contact form (messages arrive in your dashboard)
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={section.showMap}
              onChange={(e) =>
                onChange((s) => void (s.type === "contact" && (s.showMap = e.target.checked)))
              }
              className="size-5 shrink-0 accent-brand"
            />
            Show map area
          </label>
        </div>
      );

    case "gallery":
      return (
        <GalleryFields
          siteId={siteId}
          section={section}
          onChange={(change) => onChange((s) => void (s.type === "gallery" && change(s)))}
        />
      );

    default: {
      const unhandled: never = section;
      return unhandled;
    }
  }
}
