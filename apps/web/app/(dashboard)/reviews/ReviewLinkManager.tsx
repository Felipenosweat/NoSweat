"use client";

import { GOOGLE_REVIEW_URL_MESSAGE, ReviewLinkResponse, isGoogleReviewUrl } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  Notice,
  cx,
  glassButtonClass,
} from "@/components/glass";
import { clientsApi, toClientsError } from "../clients/api";
import {
  OpenIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
  sectionTitle,
} from "../clients/ui";
import { AskForReviews } from "./AskForReviews";

// Campo do link de avaliações: colar, testar e salvar. Com mais de um site, o dono escolhe em
// qual (padrão: todos). Depois de salvo aparece onde o botão fica e o painel "Ask your clients".
// `readOnly` = modo "ver como" do admin: mostra tudo, mas não salva.

export type ReviewSite = {
  id: string;
  name: string;
  url: string | null;
  /** Site no ar (o botão aparece na hora, sem publicar de novo). */
  live: boolean;
};

const ALL = "all";

/** Link salvo do alvo: o do site escolhido, ou o comum a todos (se for o mesmo em todos). */
function savedUrlOf(sites: readonly ReviewSite[], target: string): string | null {
  if (target !== ALL) return sites.find((site) => site.id === target)?.url ?? null;
  const first = sites[0]?.url ?? null;
  return sites.every((site) => site.url === first) ? first : null;
}

export function ReviewLinkManager({
  initialSites,
  readOnly,
}: {
  initialSites: ReviewSite[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const fieldId = useId();
  const [sites, setSites] = useState(initialSites);
  const [target, setTarget] = useState(ALL);
  const [value, setValue] = useState(
    () => savedUrlOf(initialSites, ALL) ?? initialSites.find((s) => s.url)?.url ?? "",
  );
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const targets = target === ALL ? sites : sites.filter((site) => site.id === target);
  const saved = savedUrlOf(sites, target);
  const trimmed = value.trim();
  const valid = isGoogleReviewUrl(trimmed);
  const fieldError =
    touched && trimmed && !valid
      ? GOOGLE_REVIEW_URL_MESSAGE
      : touched && !trimmed && !saved
        ? "Paste your review link first."
        : null;
  const unchanged = trimmed === (saved ?? "");

  // Link para o painel "Ask your clients": o do alvo, ou o primeiro salvo de qualquer site.
  const askSite = targets.find((site) => site.url) ?? sites.find((site) => site.url) ?? null;
  const anyLive = targets.some((site) => site.live && site.url);

  function pickTarget(next: string) {
    setTarget(next);
    setValue(savedUrlOf(sites, next) ?? "");
    setTouched(false);
    setError(null);
    setNotice(null);
  }

  async function save(url: string | null) {
    setSaving(true);
    setError(null);
    setNotice(null);
    const results = new Map<string, ReviewLinkResponse>();
    try {
      // Um site de cada vez (cada salvamento vira uma versão do site).
      for (const site of targets) {
        const result = await clientsApi(
          `/api/sites/${encodeURIComponent(site.id)}/review-link`,
          ReviewLinkResponse,
          { method: "PUT", body: { url } },
        );
        results.set(site.id, result);
      }
      setNotice(url ? "Saved." : "Removed. The button is gone from your website.");
      router.refresh();
    } catch (err) {
      setError(toClientsError(err).message);
    } finally {
      // O que já foi salvo fica salvo, mesmo se um dos sites falhar.
      setSites((current) =>
        current.map((site) => {
          const result = results.get(site.id);
          return result ? { ...site, url: result.googleReviewUrl, live: result.live } : site;
        }),
      );
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (readOnly || !valid) return;
    void save(trimmed);
  }

  return (
    <div className="grid gap-4">
      <GlassCard as="section" aria-labelledby="link-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="link-heading" className={sectionTitle}>
            Your review link
          </h2>
          {saved ? (
            <GlassBadge tone="live">On your website</GlassBadge>
          ) : targets.some((site) => site.url) ? (
            <GlassBadge tone="pending">On some of your websites</GlassBadge>
          ) : (
            <GlassBadge tone="neutral">Not added yet</GlassBadge>
          )}
        </div>

        <form onSubmit={onSubmit} noValidate data-tour="reviews-link" className="mt-4 grid gap-4">
          {sites.length > 1 && (
            <div>
              <label htmlFor={`${fieldId}-site`} className={labelClass}>
                Website
              </label>
              <select
                id={`${fieldId}-site`}
                value={target}
                onChange={(event) => pickTarget(event.target.value)}
                disabled={saving}
                className={cx(fieldClass, "mt-1.5 h-11 max-w-sm")}
              >
                <option value={ALL}>All my websites ({sites.length})</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={fieldId} className={labelClass}>
              Google review link
            </label>
            <input
              id={fieldId}
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setNotice(null);
              }}
              onBlur={() => setTouched(true)}
              placeholder="https://g.page/r/…/review"
              readOnly={readOnly}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `${fieldId}-error` : `${fieldId}-hint`}
              className={cx(fieldClass, "mt-1.5 h-11")}
            />
            {fieldError ? (
              <p id={`${fieldId}-error`} className={fieldErrorClass}>
                {fieldError}
              </p>
            ) : (
              <p id={`${fieldId}-hint`} className={hintClass}>
                {saved ? (
                  "This link is on your website. Paste a new one to replace it."
                ) : (
                  <>
                    Don&rsquo;t have it yet?{" "}
                    <a
                      href="#how-to"
                      className="font-semibold text-brand underline-offset-4 hover:underline"
                    >
                      Follow the 5 steps
                    </a>
                    .
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <GlassButton
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving || (unchanged && Boolean(saved))}
              >
                {saving ? "Saving…" : "Save"}
              </GlassButton>
            )}
            {valid ? (
              <a
                href={trimmed}
                target="_blank"
                rel="noopener noreferrer"
                className={glassButtonClass({ variant: "secondary" })}
              >
                <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
                  <OpenIcon />
                </span>
                Test link
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                title="Paste a Google review link first"
                className={cx(glassButtonClass({ variant: "secondary" }), "opacity-50")}
              >
                Test link
              </span>
            )}
            {!readOnly && saved && (
              <GlassButton
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setValue("");
                  setTouched(false);
                  void save(null);
                }}
              >
                Remove
              </GlassButton>
            )}
          </div>

          {readOnly && (
            <p className={hintClass}>You&rsquo;re viewing this account, so changes are off.</p>
          )}
          {error && (
            <Notice tone="error" size="sm">
              {error}
            </Notice>
          )}
          <p role="status" className="text-[15px] font-medium text-emerald-700 empty:hidden">
            {notice}
          </p>
        </form>

        {saved && (
          <div className="mt-5 border-t border-(--glass-rim) pt-4 text-[15px] leading-[1.6] text-slate-600">
            <p>
              <span className="font-semibold text-ink">Where it shows:</span> a &ldquo;Review us on
              Google&rdquo; button on your website&rsquo;s contact section and footer.
            </p>
            <p className="mt-1">
              {anyLive
                ? "It's live now. No need to publish again."
                : "It goes live the next time you publish your website."}
            </p>
          </div>
        )}
      </GlassCard>

      {askSite?.url && <AskForReviews link={askSite.url} businessName={askSite.name} />}
    </div>
  );
}
