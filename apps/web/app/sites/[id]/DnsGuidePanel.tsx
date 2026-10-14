"use client";

import type { DnsProvider, DnsRecord } from "@nosweat/schema";
import { useState } from "react";
import { focusRing, secondaryButton } from "@/components/DashboardUi";
import { DNS_GUIDES, guideById, type DnsGuideId } from "./dnsGuides";

/**
 * "Onde você comprou seu domínio?": o cliente escolhe a empresa (ou já vem marcada, descoberta
 * pelos nameservers) e vê o passo a passo dela, com um desenho do formulário já preenchido.
 */
export function DnsGuidePanel({
  domain,
  records,
  detected,
}: {
  domain: string;
  records: DnsRecord[];
  detected: DnsProvider | null;
}) {
  const [selected, setSelected] = useState<DnsGuideId | null>(detected);
  const guide = selected ? guideById(selected) : null;
  const dnsUrl = guide?.dnsUrl(domain) ?? null;

  return (
    <section
      aria-labelledby="dns-guide-title"
      className="rounded-xl border border-slate-200 p-4 sm:p-5"
    >
      <h3 id="dns-guide-title" className="font-display text-[15px] font-semibold text-ink">
        Where did you buy your domain?
      </h3>
      <p className="mt-1 text-[13px] text-slate-500">
        {detected
          ? `We checked: ${domain} is managed at ${guideById(detected).name}. Follow the steps below.`
          : "Pick the company and we'll show you exactly where to click."}
      </p>

      <div role="group" aria-label="Domain company" className="mt-3 flex flex-wrap gap-2">
        {DNS_GUIDES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected === option.id}
            onClick={() => setSelected(option.id)}
            className={`min-h-10 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-150 ${focusRing} ${
              selected === option.id
                ? "border-ink bg-ink text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>

      {guide && (
        <div className="mt-5 space-y-4">
          {dnsUrl && (
            <a href={dnsUrl} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              Open {guide.name} DNS settings ↗
            </a>
          )}

          <ol className="space-y-2.5">
            {guide.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-[15px] leading-[1.55] text-slate-700">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[13px] font-bold text-brand"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div>
            <p className="text-[13px] font-medium text-slate-500">
              What to type in {guide.id === "other" ? "the form" : `${guide.name}'s form`}:
            </p>
            <div className="mt-2 space-y-2">
              {records.map((record) => (
                <FormPreview
                  key={`${record.type}-${record.name}`}
                  record={record}
                  nameLabel={guide.fields.name}
                  valueLabel={guide.fields.value}
                  blankRoot={guide.rootName === "blank"}
                />
              ))}
            </div>
          </div>

          {guide.tips.length > 0 && (
            <ul className="space-y-1.5 rounded-lg bg-amber-50 px-4 py-3 text-[13px] leading-normal text-amber-900">
              {guide.tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          )}

          {guide.helpUrl && (
            <a
              href={guide.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] font-semibold text-slate-600 underline underline-offset-4 hover:text-ink"
            >
              {guide.name}&rsquo;s own help article ↗
            </a>
          )}
        </div>
      )}
    </section>
  );
}

/** Desenho de uma linha do formulário de DNS, já preenchida, com os nomes de campo da empresa. */
function FormPreview({
  record,
  nameLabel,
  valueLabel,
  blankRoot,
}: {
  record: DnsRecord;
  nameLabel: string;
  valueLabel: string;
  blankRoot: boolean;
}) {
  const name = blankRoot && record.name === "@" ? "" : record.name;
  return (
    <div
      aria-label={`${record.type} record: ${nameLabel} ${name || "empty"}, ${valueLabel} ${record.value}`}
      role="img"
      className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[6rem_8rem_1fr]"
    >
      <Field label="Type" value={record.type} />
      <Field label={nameLabel} value={name} placeholder="(leave empty)" />
      <Field label={valueLabel} value={record.value} mono />
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="block truncate text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span
        className={`mt-1 block truncate rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] ${
          value ? "text-ink" : "text-slate-400 italic"
        } ${mono ? "font-mono" : "font-semibold"}`}
      >
        {value || placeholder}
      </span>
    </div>
  );
}
