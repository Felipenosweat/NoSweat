"use client";

import type { Section, SectionOf, SiteImage } from "@nosweat/schema";
import { useId, useRef, useState } from "react";
import { MAX_ITEMS } from "./defaults";
import { Field, ItemList } from "./fields";
import { GalleryFields } from "./GalleryFields";
import { HeroPhotoField, PHOTO_TYPES_NOTE, SignupLink } from "./HeroPhotoField";
import { ACCEPT_ATTR, MAX_ALT, uploadImage } from "./images";
import { inputClass, secondaryButton, textareaClass, textButton, Thumb } from "./ui";

type ServiceItem = SectionOf<"services">["items"][number];
type Person = NonNullable<SectionOf<"about">["people"]>[number];

/** Limites do schema (packages/schema/src/site.ts). */
const MAX_TITLE = 80;
const MAX_PEOPLE = 6;

/** Título opcional da seção: vazio sai do SiteSpec e o site usa o título padrão do ramo. */
function setTitle(section: Section, value: string) {
  if (section.type === "hero") return;
  if (value.trim()) section.title = value;
  else delete section.title;
}

/** Campo opcional de um serviço (preço, detalhe, grupo): vazio sai do SiteSpec. */
function setServiceText(item: ServiceItem, key: "price" | "detail" | "group", value: string) {
  if (value.trim()) item[key] = value;
  else delete item[key];
}

/** Campo opcional de uma pessoa (função, frase): vazio sai do SiteSpec. */
function setPersonText(person: Person, key: "role" | "note", value: string) {
  if (value.trim()) person[key] = value;
  else delete person[key];
}

/** "Section title (optional)", igual em todas as seções que têm título. */
function TitleField({
  value,
  placeholder,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="Section title (optional)">
      <input
        className={inputClass}
        maxLength={MAX_TITLE}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

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
        <div className="space-y-4">
          <TitleField
            value={section.title}
            placeholder="e.g. What we do"
            onChange={(value) => onChange((s) => setTitle(s, value))}
          />
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
            render={(item, i) => {
              const change = (edit: (target: ServiceItem) => void) =>
                onChange((s) => {
                  const target = s.type === "services" ? s.items[i] : undefined;
                  if (target) edit(target);
                });
              return (
                <>
                  <input
                    className={inputClass}
                    aria-label={`Service ${i + 1} name`}
                    placeholder="Service name"
                    value={item.name}
                    onChange={(e) => change((target) => void (target.name = e.target.value))}
                  />
                  <textarea
                    rows={2}
                    className={textareaClass}
                    aria-label={`Service ${i + 1} description`}
                    placeholder="Short description"
                    value={item.description}
                    onChange={(e) => change((target) => void (target.description = e.target.value))}
                  />
                  {/* Preço, detalhe e grupo só aparecem no site se o dono escrever. */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={inputClass}
                      aria-label={`Service ${i + 1} price (optional)`}
                      placeholder="Price (optional)"
                      maxLength={40}
                      value={item.price ?? ""}
                      onChange={(e) =>
                        change((target) => setServiceText(target, "price", e.target.value))
                      }
                    />
                    <input
                      className={inputClass}
                      aria-label={`Service ${i + 1} detail, like 45 min (optional)`}
                      placeholder="Detail, e.g. 45 min"
                      maxLength={80}
                      value={item.detail ?? ""}
                      onChange={(e) =>
                        change((target) => setServiceText(target, "detail", e.target.value))
                      }
                    />
                    <input
                      className={`${inputClass} col-span-2`}
                      aria-label={`Service ${i + 1} group, like Color or Tacos (optional)`}
                      placeholder="Group (optional), e.g. Color"
                      maxLength={40}
                      value={item.group ?? ""}
                      onChange={(e) =>
                        change((target) => setServiceText(target, "group", e.target.value))
                      }
                    />
                  </div>
                </>
              );
            }}
          />
        </div>
      );

    case "testimonials":
      return (
        <div className="space-y-4">
          <TitleField
            value={section.title}
            placeholder="e.g. What customers say"
            onChange={(value) => onChange((s) => setTitle(s, value))}
          />
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
        </div>
      );

    case "faq":
      return (
        <div className="space-y-4">
          <TitleField
            value={section.title}
            placeholder="e.g. Questions"
            onChange={(value) => onChange((s) => setTitle(s, value))}
          />
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
        </div>
      );

    case "contact":
      // Sem "mostrar mapa": nenhum layout desenha mapa (a rota aparece junto com o endereço).
      return (
        <div className="space-y-4">
          <TitleField
            value={section.title}
            placeholder="e.g. Get in touch"
            onChange={(value) => onChange((s) => setTitle(s, value))}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-slate-700">
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

    case "about":
      return (
        <div className="space-y-4">
          <Field label="Title (optional)">
            <input
              className={inputClass}
              value={section.title ?? ""}
              maxLength={MAX_TITLE}
              onChange={(e) => onChange((s) => setTitle(s, e.target.value))}
            />
          </Field>
          <Field label="About your business">
            <textarea
              rows={5}
              className={textareaClass}
              value={section.body}
              maxLength={700}
              onChange={(e) =>
                onChange((s) => void (s.type === "about" && (s.body = e.target.value)))
              }
            />
          </Field>
          <OwnerPhotoField
            siteId={siteId}
            image={section.image}
            onChange={(image) =>
              onChange((s) => {
                if (s.type !== "about") return;
                if (image) s.image = image;
                else delete s.image;
              })
            }
          />
          <div className="space-y-2 border-t border-slate-200 pt-3">
            <h3 className="text-xs font-medium text-slate-600">People (optional)</h3>
            <ItemList
              items={section.people ?? []}
              max={MAX_PEOPLE}
              addLabel="Add person"
              itemLabel="person"
              note="Only real people who work here, in your own words."
              onAdd={() =>
                onChange((s) => {
                  if (s.type !== "about") return;
                  // Nome vazio não aparece no site até o dono escrever (sem nome de exemplo).
                  (s.people ??= []).push({ name: "" });
                })
              }
              onRemove={(i) =>
                onChange((s) => {
                  if (s.type !== "about" || !s.people) return;
                  s.people.splice(i, 1);
                  if (s.people.length === 0) delete s.people;
                })
              }
              render={(person, i) => {
                const change = (edit: (target: Person) => void) =>
                  onChange((s) => {
                    const target = s.type === "about" ? s.people?.[i] : undefined;
                    if (target) edit(target);
                  });
                return (
                  <>
                    <input
                      className={inputClass}
                      aria-label={`Person ${i + 1} name`}
                      placeholder="Name"
                      maxLength={80}
                      value={person.name}
                      onChange={(e) => change((target) => void (target.name = e.target.value))}
                    />
                    <input
                      className={inputClass}
                      aria-label={`Person ${i + 1} role (optional)`}
                      placeholder="Role (optional), e.g. Owner"
                      maxLength={80}
                      value={person.role ?? ""}
                      onChange={(e) =>
                        change((target) => setPersonText(target, "role", e.target.value))
                      }
                    />
                    <textarea
                      rows={2}
                      className={textareaClass}
                      aria-label={`Person ${i + 1} note (optional)`}
                      placeholder="One sentence about them (optional)"
                      maxLength={200}
                      value={person.note ?? ""}
                      onChange={(e) =>
                        change((target) => setPersonText(target, "note", e.target.value))
                      }
                    />
                  </>
                );
              }}
            />
          </div>
        </div>
      );

    default: {
      const unhandled: never = section;
      return unhandled;
    }
  }
}

/**
 * Foto do "quem somos": só foto enviada pelo dono (kind "owner"). Banco de imagens não entra aqui,
 * porque o site mostraria um desconhecido como se fosse a equipe.
 */
function OwnerPhotoField({
  siteId,
  image,
  onChange,
}: {
  siteId: string;
  image: SiteImage | undefined;
  onChange: (image: SiteImage | undefined) => void;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<{ message: string; signup?: boolean } | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const result = await uploadImage(siteId, file, image?.alt);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (result.ok) onChange(result.image);
    else setError({ message: result.message, signup: result.signup });
  }

  // Foto de banco de imagens antiga (não aparece no site): trata como sem foto.
  const owner = image?.kind === "owner" ? image : undefined;
  const altId = `${ids}-alt`;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3">
      <h3 className="text-xs font-medium text-slate-600">Your photo (optional)</h3>
      {owner ? (
        <div className="space-y-2">
          <Thumb src={owner.url} alt={owner.alt} className="aspect-[4/3] w-full rounded-lg" />
          <div>
            <label htmlFor={altId} className="block text-xs font-medium text-slate-600">
              Describe the photo (for screen readers and Google)
            </label>
            <input
              id={altId}
              className={inputClass}
              maxLength={MAX_ALT}
              value={owner.alt}
              placeholder="e.g. Maria, the owner, in the shop"
              onChange={(e) => onChange({ ...owner, alt: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          A photo of you, your team or your place. Only upload photos you took or have the rights
          to.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {/* O input de arquivo fica escondido; o botão abre o seletor e é focável pelo teclado. */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className={secondaryButton}
        >
          {uploading ? "Uploading..." : owner ? "Replace photo" : "Upload a photo"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTR}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void upload(e.target.files?.[0])}
          className="hidden"
        />
        {owner && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`${textButton} px-1 py-2 text-red-700`}
          >
            Remove photo
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">{PHOTO_TYPES_NOTE}</p>
      {error &&
        (error.signup ? (
          <p role="alert" className="text-xs text-slate-700">
            <SignupLink siteId={siteId}>{error.message}</SignupLink>
          </p>
        ) : (
          <p role="alert" className="text-xs font-medium text-red-700">
            {error.message}
          </p>
        ))}
    </div>
  );
}
