"use client";

import type { DnsProvider, DnsRecord } from "@nosweat/schema";
import { focusRing, secondaryButton } from "@/components/DashboardUi";
import { Notice, cx, glassButtonClass } from "@/components/glass";
import { DNS_GUIDES, guideById, type DnsGuideId } from "./dnsGuides";

/**
 * "Onde você comprou seu domínio?": o cliente escolhe a empresa (ou já vem marcada, descoberta
 * pelos nameservers) e vê o passo a passo dela, com um desenho do formulário já preenchido.
 * A escolha fica no DomainPanel (com o passo a passo aberto, ele esconde a tabela de registros),
 * e por isso os valores também podem ser copiados daqui.
 */
export function DnsGuidePanel({
  domain,
  records,
  detected,
  selected,
  onSelect,
  copied,
  onCopy,
}: {
  domain: string;
  records: DnsRecord[];
  detected: DnsProvider | null;
  selected: DnsGuideId | null;
  onSelect: (id: DnsGuideId) => void;
  /** Valor copiado agora há pouco (mostra "Copied" no botão dele). */
  copied: string | null;
  onCopy: (value: string) => void;
}) {
  const guide = selected ? guideById(selected) : null;
  const dnsUrl = guide?.dnsUrl(domain) ?? null;

  return (
    <section aria-labelledby="dns-guide-title" className="glass-inset rounded-xl p-4">
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
            onClick={() => onSelect(option.id)}
            className={cx(
              "min-h-11 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 sm:min-h-10",
              // Escolhida: o mesmo vidro tingido das cápsulas de filtro do painel.
              selected === option.id
                ? "glass-tint text-white [--glass-tint:#071b33]"
                : "glass glass-flat glass-interactive text-(--glass-fg)",
              focusRing,
            )}
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

          {/* Os registros vêm antes dos passos: os passos falam da "table above". */}
          <div>
            <p className="text-[13px] font-medium text-slate-500">
              What to type in {guide.id === "other" ? "the form" : `${guide.name}'s form`}:
            </p>
            <div className="mt-2 space-y-3">
              {records.map((record) => (
                <div key={`${record.type}-${record.name}`}>
                  <FormPreview
                    record={record}
                    nameLabel={guide.fields.name}
                    valueLabel={guide.fields.value}
                    blankRoot={guide.rootName === "blank"}
                  />
                  <button
                    type="button"
                    onClick={() => onCopy(record.value)}
                    className={`mt-2 ${glassButtonClass({ variant: "secondary", size: "sm" })}`}
                  >
                    {copied === record.value ? "Copied" : "Copy"}
                    <span className="sr-only"> {record.type} value</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

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

          {guide.tips.length > 0 && (
            <Notice tone="warning" size="sm" role={null}>
              <ul className="space-y-1.5">
                {guide.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Notice>
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
      className="glass-edge grid gap-2 rounded-xl bg-slate-900/[0.03] p-3 sm:grid-cols-[6rem_8rem_1fr]"
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
        // Valor (ex.: o código TXT de 47 letras) quebra a linha em vez de cortar com "…":
        // as pessoas copiam o que veem.
        className={`mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] ${
          value ? "text-ink" : "text-slate-500 italic"
        } ${mono ? "font-mono break-all" : "truncate font-semibold"}`}
      >
        {value || placeholder}
      </span>
    </div>
  );
}
