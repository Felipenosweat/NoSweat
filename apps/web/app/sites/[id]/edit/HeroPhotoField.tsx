"use client";

import type { SiteImage } from "@nosweat/schema";
import { useId, useRef, useState, type FormEvent } from "react";
import { ACCEPT_ATTR, MAX_ALT, searchImages, uploadImage } from "./images";
import { inputClass, primaryButton, secondaryButton, textButton, Thumb } from "./ui";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; query: string; results: SiteImage[] }
  | { status: "not-configured" }
  | { status: "error"; message: string };

/** Foto do topo: miniatura, texto alternativo, crédito, busca em banco de imagens e upload. */
export function HeroPhotoField({
  siteId,
  image,
  suggestedQuery,
  onChange,
}: {
  siteId: string;
  image: SiteImage | undefined;
  suggestedQuery: string;
  onChange: (image: SiteImage | undefined) => void;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState(suggestedQuery);
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function runSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setSearch({ status: "error", message: "Type at least two letters to search." });
      return;
    }
    setSearch({ status: "loading" });
    const result = await searchImages(q);
    if (result.ok) setSearch({ status: "done", query: q, results: result.results });
    else if (result.notConfigured) setSearch({ status: "not-configured" });
    else setSearch({ status: "error", message: result.message });
  }

  function choose(picked: SiteImage) {
    onChange(picked);
    setSearchOpen(false);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadImage(siteId, file, image?.alt);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (result.ok) {
      onChange(result.image);
      setSearchOpen(false);
    } else {
      setUploadError(result.message);
    }
  }

  const altId = `${ids}-alt`;
  const searchId = `${ids}-search`;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3">
      <h3 className="text-xs font-medium text-slate-600">Photo</h3>

      {image ? (
        <div className="space-y-2">
          <Thumb src={image.url} alt={image.alt} className="aspect-[16/9] w-full rounded-lg" />
          {image.credit && (
            <p className="text-xs text-slate-500">
              Photo by{" "}
              <a
                href={image.credit.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-700 underline underline-offset-2 hover:text-ink"
              >
                {image.credit.name}
              </a>
              {image.source === "pexels" && " on Pexels"}
              {image.source === "unsplash" && " on Unsplash"}
            </p>
          )}
          {image.kind === "scene" && (
            <p className="text-xs text-slate-500">
              Stock photo: it sets the mood but doesn&rsquo;t show your own team or work.
            </p>
          )}
          <div>
            <label htmlFor={altId} className="block text-xs font-medium text-slate-600">
              Describe the photo (for screen readers and Google)
            </label>
            <input
              id={altId}
              className={inputClass}
              maxLength={MAX_ALT}
              value={image.alt}
              placeholder="e.g. Bright, freshly cleaned kitchen"
              onChange={(e) => onChange({ ...image, alt: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
          No photo at the top yet.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={searchOpen}
          aria-controls={`${ids}-panel`}
          onClick={() => setSearchOpen((open) => !open)}
          className={secondaryButton}
        >
          {image ? "Change photo" : "Find a photo"}
        </button>
        {/* O input de arquivo fica escondido; o botão abre o seletor e é focável pelo teclado. */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className={secondaryButton}
        >
          {uploading ? "Uploading..." : "Upload your own"}
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
        {image && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`${textButton} px-1 py-2 text-red-700`}
          >
            Remove photo
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">JPG, PNG or WebP, up to 8 MB.</p>
      {uploadError && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {uploadError}
        </p>
      )}

      {searchOpen && (
        <div id={`${ids}-panel`} className="space-y-3 rounded-lg bg-slate-50 p-3">
          <form onSubmit={runSearch} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={searchId} className="block text-xs font-medium text-slate-600">
                Search free stock photos
              </label>
              <input
                id={searchId}
                type="search"
                className={inputClass}
                value={query}
                maxLength={80}
                placeholder="e.g. clean modern kitchen"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={search.status === "loading"} className={primaryButton}>
              Search
            </button>
          </form>

          <div aria-live="polite">
            {search.status === "loading" && (
              <p className="text-xs text-slate-500">Looking for photos...</p>
            )}
            {search.status === "not-configured" && (
              <p className="text-xs text-slate-600">
                Photo search isn&rsquo;t set up yet. You can still upload your own photo.
              </p>
            )}
            {search.status === "error" && (
              <p role="alert" className="text-xs font-medium text-red-700">
                {search.message}
              </p>
            )}
            {search.status === "done" && search.results.length === 0 && (
              <p className="text-xs text-slate-600">
                No photos for &ldquo;{search.query}&rdquo;. Try simpler words, like
                &ldquo;kitchen&rdquo; or &ldquo;toolbox&rdquo;.
              </p>
            )}
          </div>

          {search.status === "done" && search.results.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {search.results.map((result) => (
                <li key={result.url}>
                  <button
                    type="button"
                    onClick={() => choose(result)}
                    aria-label={`Use photo: ${result.alt || "untitled"}${
                      result.credit ? `, by ${result.credit.name}` : ""
                    }`}
                    className="group block w-full overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Thumb src={result.url} alt="" className="aspect-[4/3] w-full" />
                    {result.credit && (
                      <span className="block truncate px-2 py-1 text-left text-[11px] text-slate-500">
                        {result.credit.name}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
