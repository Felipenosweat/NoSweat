"use client";

import {
  OfficeSettingsResponse,
  UpdateOfficeSettingsRequest,
  type OfficeSettings,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { GlassButton, GlassCard } from "@/components/glass";
import { US_TIME_ZONES, bpsToPercentInput, parsePercentToBps } from "@/lib/office";
import { ErrorNote, officeApi, toOfficeError, type OfficeApiError } from "../_ui/api";
import { CardHeading, useUnsavedWarning } from "../_ui/editor";
import { fieldClass, fieldErrorClass, hintClass, labelClass } from "../_ui/ui";

// Configurações do escritório: dados da empresa que saem no orçamento e na fatura, padrões de
// documento novo (imposto, prazos), textos do dono (condições, como pagar) e o fuso da agenda.
// Salvar é explícito (um botão "Save changes").

type FieldName =
  | "companyName"
  | "phone"
  | "email"
  | "address"
  | "defaultTaxRate"
  | "invoiceDueDays"
  | "estimateValidDays"
  | "estimateTerms"
  | "paymentInstructions"
  | "timeZone";

type Values = Record<FieldName, string>;

function valuesFrom(settings: OfficeSettings): Values {
  return {
    companyName: settings.companyName,
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    defaultTaxRate: bpsToPercentInput(settings.defaultTaxRateBps),
    invoiceDueDays: String(settings.invoiceDueDays),
    estimateValidDays: String(settings.estimateValidDays),
    estimateTerms: settings.estimateTerms,
    paymentInstructions: settings.paymentInstructions,
    timeZone: settings.timeZone,
  };
}

/** Dias digitados → inteiro (ou undefined se não for número inteiro). */
function parseDays(input: string): number | undefined {
  const clean = input.trim();
  return /^\d{1,3}$/.test(clean) ? Number(clean) : undefined;
}

const DUE_PRESETS = [
  { days: 0, label: "On receipt" },
  { days: 7, label: "7 days" },
  { days: 15, label: "15 days" },
  { days: 30, label: "30 days" },
] as const;

/** Rótulo + campo + erro (ou dica). Fora do formulário para o campo não ser recriado a cada tecla. */
function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={fieldErrorClass}>
          {error}
        </p>
      ) : hint ? (
        <p className={hintClass}>{hint}</p>
      ) : null}
    </div>
  );
}

export function SettingsForm({
  settings,
  readOnly,
}: {
  settings: OfficeSettings;
  readOnly: boolean;
}) {
  const router = useRouter();
  const ids = useId();
  const [values, setValues] = useState<Values>(() => valuesFrom(settings));
  const [saved, setSaved] = useState<Values>(() => valuesFrom(settings));
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [notice, setNotice] = useState("");

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedWarning(!readOnly && dirty);

  function set(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || readOnly) return;
    setError(null);
    const next: Partial<Record<FieldName, string>> = {};
    const taxRateBps = parsePercentToBps(values.defaultTaxRate);
    if (taxRateBps === undefined) next.defaultTaxRate = "Use a tax rate from 0 to 30%, like 8.25.";
    const dueDays = parseDays(values.invoiceDueDays);
    if (dueDays === undefined || dueDays > 120) next.invoiceDueDays = "Use 0 to 120 days.";
    const validDays = parseDays(values.estimateValidDays);
    if (validDays === undefined || validDays < 1 || validDays > 365) {
      next.estimateValidDays = "Use 1 to 365 days.";
    }
    const parsed = UpdateOfficeSettingsRequest.safeParse({
      companyName: values.companyName,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      address: values.address.trim() || null,
      defaultTaxRateBps: taxRateBps ?? 0,
      invoiceDueDays: dueDays ?? 0,
      estimateValidDays: validDays ?? 1,
      estimateTerms: values.estimateTerms,
      paymentInstructions: values.paymentInstructions,
      timeZone: values.timeZone,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        const field: FieldName | undefined =
          key === "companyName"
            ? "companyName"
            : key === "phone"
              ? "phone"
              : key === "email"
                ? "email"
                : key === "address"
                  ? "address"
                  : key === "estimateTerms"
                    ? "estimateTerms"
                    : key === "paymentInstructions"
                      ? "paymentInstructions"
                      : key === "timeZone"
                        ? "timeZone"
                        : undefined;
        if (field && !next[field]) {
          next[field] =
            field === "companyName" && !values.companyName.trim()
              ? "Please enter your company name."
              : issue.message;
        }
      }
    }
    if (Object.keys(next).length > 0 || !parsed.success) {
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`${ids}-${first}`)?.focus();
      else setError(toOfficeError(null));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await officeApi("/api/office/settings", OfficeSettingsResponse, {
        method: "PUT",
        body: parsed.data,
      });
      const fresh = valuesFrom(result.settings);
      setValues(fresh);
      setSaved(fresh);
      setNotice("Saved");
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setPending(false);
    }
  }

  const errorProps = (field: FieldName) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${ids}-${field}-error` }
      : {};

  const errorText = (field: FieldName) =>
    errors[field] ? (
      <p id={`${ids}-${field}-error`} className={fieldErrorClass}>
        {errors[field]}
      </p>
    ) : null;

  const timeZones = US_TIME_ZONES.some((zone) => zone.value === values.timeZone)
    ? US_TIME_ZONES
    : [{ value: values.timeZone, label: values.timeZone }, ...US_TIME_ZONES];

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Business settings">
      <fieldset disabled={pending || readOnly} className="grid gap-4">
        <GlassCard as="section" aria-labelledby={`${ids}-company`}>
          <CardHeading id={`${ids}-company`}>Your company</CardHeading>
          <p className={`${hintClass} -mt-3 mb-5`}>
            Shows at the top of every estimate and invoice.
          </p>
          <div className="grid gap-5">
            <Field id={`${ids}-companyName`} error={errors.companyName} label="Company name">
              <input
                id={`${ids}-companyName`}
                value={values.companyName}
                onChange={(event) => set("companyName", event.target.value)}
                maxLength={120}
                autoComplete="organization"
                className={`${fieldClass} mt-1.5 h-11`}
                {...errorProps("companyName")}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={`${ids}-phone`} error={errors.phone} label="Phone" optional>
                <input
                  id={`${ids}-phone`}
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  maxLength={40}
                  placeholder="(512) 555-0100"
                  autoComplete="tel"
                  className={`${fieldClass} mt-1.5 h-11`}
                  {...errorProps("phone")}
                />
              </Field>
              <Field id={`${ids}-email`} error={errors.email} label="Email" optional>
                <input
                  id={`${ids}-email`}
                  type="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  maxLength={254}
                  autoCapitalize="none"
                  autoComplete="email"
                  className={`${fieldClass} mt-1.5 h-11`}
                  {...errorProps("email")}
                />
              </Field>
            </div>
            <Field id={`${ids}-address`} error={errors.address} label="Address" optional>
              <textarea
                id={`${ids}-address`}
                value={values.address}
                onChange={(event) => set("address", event.target.value)}
                rows={2}
                maxLength={300}
                placeholder={"123 Main St\nAustin, TX 78701"}
                autoComplete="street-address"
                className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                {...errorProps("address")}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-defaults`}>
          <CardHeading id={`${ids}-defaults`}>New estimates and invoices</CardHeading>
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id={`${ids}-defaultTaxRate`}
                error={errors.defaultTaxRate}
                label="Sales tax rate"
                hint="Used on new documents. You can change it on each one."
              >
                <div className="relative mt-1.5">
                  <input
                    id={`${ids}-defaultTaxRate`}
                    inputMode="decimal"
                    value={values.defaultTaxRate}
                    onChange={(event) => set("defaultTaxRate", event.target.value)}
                    autoComplete="off"
                    className={`${fieldClass} h-11 pr-8 tabular-nums`}
                    {...errorProps("defaultTaxRate")}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500"
                  >
                    %
                  </span>
                </div>
              </Field>
              <Field
                id={`${ids}-estimateValidDays`}
                error={errors.estimateValidDays}
                label="Estimates are good for"
                hint="Days before an estimate expires."
              >
                <div className="relative mt-1.5">
                  <input
                    id={`${ids}-estimateValidDays`}
                    inputMode="numeric"
                    value={values.estimateValidDays}
                    onChange={(event) => set("estimateValidDays", event.target.value)}
                    autoComplete="off"
                    className={`${fieldClass} h-11 pr-14 tabular-nums`}
                    {...errorProps("estimateValidDays")}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500"
                  >
                    days
                  </span>
                </div>
              </Field>
            </div>

            <fieldset>
              <legend className={labelClass}>Invoices are due</legend>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {DUE_PRESETS.map((preset) => (
                  <GlassButton
                    key={preset.days}
                    variant="secondary"
                    aria-pressed={values.invoiceDueDays === String(preset.days)}
                    onClick={() => set("invoiceDueDays", String(preset.days))}
                    className="aria-pressed:bg-ink aria-pressed:text-white"
                  >
                    {preset.label}
                  </GlassButton>
                ))}
                <label htmlFor={`${ids}-invoiceDueDays`} className="sr-only">
                  Days until due
                </label>
                <div className="relative w-32">
                  <input
                    id={`${ids}-invoiceDueDays`}
                    inputMode="numeric"
                    value={values.invoiceDueDays}
                    onChange={(event) => set("invoiceDueDays", event.target.value)}
                    autoComplete="off"
                    className={`${fieldClass} h-11 pr-14 tabular-nums`}
                    {...errorProps("invoiceDueDays")}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500"
                  >
                    days
                  </span>
                </div>
              </div>
              {errors.invoiceDueDays ? (
                errorText("invoiceDueDays")
              ) : (
                <p className={hintClass}>0 means due when they get it.</p>
              )}
            </fieldset>
          </div>
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-texts`}>
          <CardHeading id={`${ids}-texts`}>What your customers read</CardHeading>
          <div className="grid gap-5">
            <Field
              id={`${ids}-paymentInstructions`}
              error={errors.paymentInstructions}
              label="How to pay"
              optional
              hint="Shows on every invoice."
            >
              <textarea
                id={`${ids}-paymentInstructions`}
                value={values.paymentInstructions}
                onChange={(event) => set("paymentInstructions", event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={
                  "Zelle: pay@joesplumbing.com\nChecks payable to Joe's Plumbing LLC\nCash on completion"
                }
                className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                {...errorProps("paymentInstructions")}
              />
            </Field>
            <Field
              id={`${ids}-estimateTerms`}
              error={errors.estimateTerms}
              label="Estimate terms"
              optional
              hint="Shows at the bottom of every estimate, in your own words."
            >
              <textarea
                id={`${ids}-estimateTerms`}
                value={values.estimateTerms}
                onChange={(event) => set("estimateTerms", event.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="50% deposit to schedule. Balance due when the job is done."
                className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                {...errorProps("estimateTerms")}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-schedule`}>
          <CardHeading id={`${ids}-schedule`}>Schedule</CardHeading>
          <Field
            id={`${ids}-timeZone`}
            error={errors.timeZone}
            label="Time zone"
            hint="Used for your schedule, due dates and “today”."
          >
            <select
              id={`${ids}-timeZone`}
              value={values.timeZone}
              onChange={(event) => set("timeZone", event.target.value)}
              className={`${fieldClass} mt-1.5 h-11 cursor-pointer`}
              {...errorProps("timeZone")}
            >
              {timeZones.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </Field>
        </GlassCard>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      {!readOnly && (
        <div className="sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-20 mt-6 flex items-center justify-end gap-3 lg:bottom-4">
          <p role="status" className="text-[15px] font-semibold text-emerald-700 empty:hidden">
            {notice}
          </p>
          <GlassButton type="submit" variant="primary" loading={pending} disabled={!dirty}>
            {pending ? "Saving…" : "Save changes"}
          </GlassButton>
        </div>
      )}
    </form>
  );
}
