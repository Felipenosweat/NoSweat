"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { PhotoMode } from "@nosweat/schema";
import { ACCEPT_ATTR, checkFile } from "@/app/sites/[id]/edit/images";
import { MAX_OWN_PHOTOS } from "./photos";
import { focusRing, secondaryButtonCompact } from "./ui";

// Passo "Photos" do assistente do /create: a No Sweat escolhe as fotos (padrão) ou o dono manda
// as dele. Com "own" o site NÃO usa fotos de banco; as do dono vão para o topo e a galeria.

const rowClass =
  "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 has-checked:border-brand has-checked:ring-1 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand";

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

type PhotoStepProps = {
  mode: PhotoMode;
  onModeChange: (mode: PhotoMode) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Só contas enviam fotos (custo de armazenamento); visitante adiciona no editor depois. */
  signedIn: boolean;
  labelledBy: string;
};

export function PhotoStep({
  mode,
  onModeChange,
  files,
  onFilesChange,
  signedIn,
  labelledBy,
}: PhotoStepProps) {
  const inputId = useId();
  const [problem, setProblem] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const known = new Set(files.map(fileKey));
    const next = files.slice();
    let message: string | null = null;
    for (const file of Array.from(list)) {
      const invalid = checkFile(file);
      if (invalid) {
        message = invalid;
        continue;
      }
      if (known.has(fileKey(file))) continue;
      if (next.length >= MAX_OWN_PHOTOS) {
        message = `You can add up to ${MAX_OWN_PHOTOS} photos here. Add more in the editor.`;
        break;
      }
      known.add(fileKey(file));
      next.push(file);
    }
    setProblem(message);
    onFilesChange(next);
  }

  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-3">
        <label className={rowClass}>
          <input
            type="radio"
            name="photos"
            value="auto"
            checked={mode === "auto"}
            onChange={() => onModeChange("auto")}
            className="mt-1 size-4 accent-brand"
          />
          <span>
            <span className="block font-display text-[15px] font-semibold text-ink">
              Let us choose photos for you{" "}
              <span className="font-sans text-[13px] font-medium text-brand">(recommended)</span>
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-(--glass-fg-muted)">
              We pick professional photos that fit your business. You can swap them any time.
            </span>
          </span>
        </label>
        <label className={rowClass}>
          <input
            type="radio"
            name="photos"
            value="own"
            checked={mode === "own"}
            onChange={() => onModeChange("own")}
            className="mt-1 size-4 accent-brand"
          />
          <span>
            <span className="block font-display text-[15px] font-semibold text-ink">
              I’ll add my own
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-(--glass-fg-muted)">
              Your site uses only your photos, never stock ones.
            </span>
          </span>
        </label>
      </div>

      {mode === "own" && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
          {signedIn ? (
            <>
              <p className="text-[14px] leading-snug text-slate-600">
                Add up to {MAX_OWN_PHOTOS} photos (JPG, PNG or WebP). The first one goes on top of
                your site and the others become a photo gallery.
              </p>
              <input
                id={inputId}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  // Deixa escolher o mesmo arquivo de novo depois de tirá-lo da lista.
                  event.target.value = "";
                }}
              />
              <label
                htmlFor={inputId}
                className={`${secondaryButtonCompact} mt-3 cursor-pointer has-focus-visible:outline-2`}
              >
                {files.length === 0 ? "Choose photos" : "Add more photos"}
              </label>
              {problem && (
                <p role="alert" className="mt-3 text-[13px] text-red-700">
                  {problem}
                </p>
              )}
              {files.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {files.map((file) => (
                    <li key={fileKey(file)} className="flex min-h-11 items-center gap-3 py-1">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onFilesChange(files.filter((other) => fileKey(other) !== fileKey(file)))
                        }
                        aria-label={`Remove ${file.name}`}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[13px] font-semibold text-brand hover:text-brand-dark ${focusRing}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-[14px] leading-snug text-slate-600">
              Photo uploads need a free account.{" "}
              <Link
                href="/signup?next=/create"
                className={`font-semibold text-brand underline underline-offset-4 hover:text-brand-dark ${focusRing}`}
              >
                Create one now
              </Link>{" "}
              (your answers are kept), or keep going: we’ll build the site without stock photos and
              you can add yours in the editor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
