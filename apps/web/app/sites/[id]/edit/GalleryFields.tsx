"use client";

import type { SectionOf, SiteImage } from "@nosweat/schema";
import { useId, useRef, useState } from "react";
import { ACCEPT_ATTR, checkFile, MAX_ALT, MAX_GALLERY_IMAGES, uploadImage } from "./images";
import { inputClass, secondaryButton, textButton, Thumb } from "./ui";

type Gallery = SectionOf<"gallery">;

/** Galeria de fotos do dono: título opcional, fotos com descrição, ordem e upload. */
export function GalleryFields({
  siteId,
  section,
  onChange,
}: {
  siteId: string;
  section: Gallery;
  /** Recebe uma função que altera a cópia da galeria (só é chamada se a seção ainda for galeria). */
  onChange: (change: (gallery: Gallery) => void) => void;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const count = section.images.length;
  const full = count >= MAX_GALLERY_IMAGES;

  function move(index: number, delta: -1 | 1) {
    onChange((g) => {
      const [image] = g.images.splice(index, 1);
      if (image) g.images.splice(index + delta, 0, image);
    });
  }

  /** Envia um arquivo por vez para não sobrecarregar a conexão do cliente. */
  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (fileInput.current) fileInput.current.value = "";
    if (!files.length) return;

    const problems: string[] = [];
    const room = MAX_GALLERY_IMAGES - count;
    const accepted = files.slice(0, Math.max(room, 0));
    if (files.length > accepted.length) {
      problems.push(
        `A gallery holds up to ${MAX_GALLERY_IMAGES} photos, so ${
          files.length - accepted.length
        } ${files.length - accepted.length === 1 ? "photo was" : "photos were"} skipped.`,
      );
    }
    const valid: File[] = [];
    for (const file of accepted) {
      const problem = checkFile(file);
      if (problem) problems.push(problem);
      else valid.push(file);
    }

    // Mesma mensagem não aparece duas vezes (ex.: vários arquivos com o mesmo erro).
    const report = (message: string) => {
      if (!problems.includes(message)) problems.push(message);
      setErrors([...problems]);
    };

    setErrors([...problems]);
    setProgress({ done: 0, total: valid.length });
    for (const [i, file] of valid.entries()) {
      const result = await uploadImage(siteId, file);
      if (result.ok) {
        const image: SiteImage = { ...result.image, alt: result.image.alt.slice(0, MAX_ALT) };
        onChange((g) => {
          if (g.images.length < MAX_GALLERY_IMAGES) g.images.push(image);
        });
      } else {
        report(result.message);
        // Upload desligado no servidor (501): os outros arquivos falhariam do mesmo jeito.
        if (result.unavailable) break;
      }
      setProgress({ done: i + 1, total: valid.length });
    }
    setProgress(null);
  }

  const titleId = `${ids}-title`;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Photos of your own work, team or place. Only upload photos you took or have the rights to.
      </p>
      <div>
        <label htmlFor={titleId} className="block text-xs font-medium text-slate-600">
          Title (optional)
        </label>
        <input
          id={titleId}
          className={inputClass}
          maxLength={80}
          placeholder="e.g. Recent projects"
          value={section.title ?? ""}
          onChange={(e) =>
            onChange((g) => {
              if (e.target.value) g.title = e.target.value;
              else delete g.title;
            })
          }
        />
      </div>

      {count > 0 ? (
        <ol className="space-y-2">
          {section.images.map((image, index) => {
            const altId = `${ids}-alt-${index}`;
            const missing = !image.alt.trim();
            return (
              <li key={`${image.url}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-2">
                <Thumb src={image.url} alt="" className="size-20 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-1">
                  <label htmlFor={altId} className="block text-xs font-medium text-slate-600">
                    Photo {index + 1} description <span className="text-red-700">(required)</span>
                  </label>
                  <input
                    id={altId}
                    required
                    aria-invalid={missing}
                    maxLength={MAX_ALT}
                    placeholder="e.g. Finished deck in a backyard"
                    className={`${inputClass} ${missing ? "border-red-400" : ""}`}
                    value={image.alt}
                    onChange={(e) =>
                      onChange((g) => {
                        const target = g.images[index];
                        if (target) target.alt = e.target.value;
                      })
                    }
                  />
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Move photo ${index + 1} up`}
                      className={`${textButton} px-1 py-1 text-slate-600`}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={index === count - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Move photo ${index + 1} down`}
                      className={`${textButton} px-1 py-1 text-slate-600`}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange((g) => void g.images.splice(index, 1))}
                      aria-label={`Remove photo ${index + 1}`}
                      className={`${textButton} px-1 py-1 text-red-700`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
          No photos yet. Add a few of your best ones.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={full || progress !== null}
          onClick={() => fileInput.current?.click()}
          className={secondaryButton}
        >
          {progress ? `Uploading ${progress.done + 1} of ${progress.total}...` : "Add photos"}
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void addFiles(e.target.files)}
          className="hidden"
        />
        <span className="text-xs text-slate-500">
          {count} of {MAX_GALLERY_IMAGES} · JPG, PNG or WebP, up to 8 MB each
        </span>
      </div>
      <div aria-live="polite" className="sr-only">
        {progress ? `Uploading photo ${progress.done + 1} of ${progress.total}` : ""}
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-xs font-medium text-red-700">
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
