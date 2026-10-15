import { fixtures } from "@nosweat/fixtures";
import { searchSnippet } from "@/components/site-metadata";

// Resultado de busca com o título e a descrição que o site de exemplo realmente publica
// (a mesma regra de `searchSnippet`, usada nos sites publicados).

const sparkle = fixtures["sparkle-cleaning"];

export function SearchDemo() {
  const { title, description } = searchSnippet(sparkle);
  return (
    <div
      aria-hidden="true"
      className="relative max-w-xl rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <span className="absolute top-3 right-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-slate-500">
        Example
      </span>
      <p className="flex items-center gap-2.5 pr-16">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
          S
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm text-ink">{sparkle.business.name}</span>
          <span className="block truncate text-xs text-slate-500">
            nosweatfd.com › s › sparkle-co-cleaning
          </span>
        </span>
      </p>
      <p className="mt-2 text-lg leading-snug text-brand-dark">{title}</p>
      {description && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>
      )}
    </div>
  );
}
