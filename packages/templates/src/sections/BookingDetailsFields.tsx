"use client";

import { smsConsentIntro } from "@nosweat/schema";
import { useId, type ReactNode } from "react";
import {
  cancellationHoursText,
  countryLabel,
  findCountry,
  formatNationalInput,
  PHONE_COUNTRIES,
  type BookingDetails,
  type DetailErrors,
} from "./booking-form";
import { VISITOR_PRIVACY_URL } from "./ContactForm";

// Campos do passo "seus dados" da marcação (nome, sobrenome, telefone com país, e-mail, nota) e as
// caixas de aceite. Serve os dois visuais: o padrão (classes ns-*) e o "soft" (classes .ns-s-*).
// Devolve um fragmento: quem usa põe dentro da sua grade.

export type BookingDetailsFieldsProps = {
  soft?: boolean;
  details: BookingDetails;
  onChange: (patch: Partial<BookingDetails>) => void;
  /** Só os erros que já podem aparecer (campo visitado ou envio tentado). */
  errors: DetailErrors;
  onBlurField: (key: keyof DetailErrors) => void;
  /** Política de cancelamento do dono; vazia = sem texto e sem a segunda caixa. */
  cancellationPolicy?: string;
  cancellationHours?: number;
  /** O dono usa lembretes por texto: mostra a caixa OPCIONAL (nunca marcada, nunca obrigatória). */
  smsReminders?: boolean;
  /** Nome da empresa no aviso de consentimento ("text messages from {Business}"). */
  businessName?: string;
};

const fieldBase =
  "mt-1.5 block w-full rounded-lg border border-ns-border bg-ns-background px-4 py-3 text-base text-ns-text placeholder:text-ns-muted/70 focus:border-ns-primary focus:ring-2 focus:ring-ns-primary/20 focus:outline-none";
const fieldBox = fieldBase.replace("mt-1.5 ", "");
const linkClass =
  "underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary";

function Field({
  soft,
  id,
  label,
  optional,
  error,
  className,
  children,
}: {
  soft: boolean;
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={soft ? undefined : className}>
      <label htmlFor={id} className={soft ? undefined : "block text-sm font-medium"}>
        {label}
        {optional && (
          <>
            {" "}
            <span className={soft ? undefined : "font-normal text-ns-muted"}>(optional)</span>
          </>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={soft ? "ns-s-fielderr" : "mt-1.5 text-sm font-medium text-ns-primary"}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function BookingDetailsFields({
  soft = false,
  details,
  onChange,
  errors,
  onBlurField,
  cancellationPolicy,
  cancellationHours,
  smsReminders = false,
  businessName = "",
}: BookingDetailsFieldsProps) {
  const base = useId().replace(/:/g, "");
  const ids = {
    first: `${base}-first`,
    last: `${base}-last`,
    phone: `${base}-phone`,
    country: `${base}-country`,
    email: `${base}-email`,
    notes: `${base}-notes`,
    privacy: `${base}-privacy`,
    cancel: `${base}-cancel`,
    policy: `${base}-policy`,
    sms: `${base}-sms`,
  };
  const country = findCountry(details.phoneCountry);
  const policy = cancellationPolicy?.trim() || "";
  const hoursText = cancellationHoursText(cancellationHours);
  const wide = soft ? undefined : "@min-[40rem]:col-span-2";
  const box = soft ? undefined : fieldBase;

  const invalid = (key: keyof DetailErrors, id: string) =>
    errors[key]
      ? ({ "aria-invalid": true, "aria-describedby": `${id}-error` } as const)
      : ({ "aria-invalid": false } as const);

  const names = (
    <>
      <Field soft={soft} id={ids.first} label="First name" error={errors.firstName}>
        <input
          id={ids.first}
          name="firstName"
          required
          aria-required="true"
          maxLength={60}
          autoComplete="given-name"
          value={details.firstName}
          onChange={(event) => onChange({ firstName: event.target.value })}
          onBlur={() => onBlurField("firstName")}
          className={box}
          {...invalid("firstName", ids.first)}
        />
      </Field>
      <Field soft={soft} id={ids.last} label="Last name" error={errors.lastName}>
        <input
          id={ids.last}
          name="lastName"
          required
          aria-required="true"
          maxLength={60}
          autoComplete="family-name"
          value={details.lastName}
          onChange={(event) => onChange({ lastName: event.target.value })}
          onBlur={() => onBlurField("lastName")}
          className={box}
          {...invalid("lastName", ids.last)}
        />
      </Field>
    </>
  );

  return (
    <>
      {soft ? <div className="ns-s-pair">{names}</div> : names}

      <Field
        soft={soft}
        id={ids.phone}
        label="Phone"
        error={errors.phone}
        className="@min-[40rem]:col-span-2"
      >
        <div
          className={
            soft ? "ns-s-phone" : "mt-1.5 grid gap-2 @min-[40rem]:grid-cols-[11rem_minmax(0,1fr)]"
          }
        >
          <select
            id={ids.country}
            name="phoneCountry"
            aria-label="Country calling code"
            autoComplete="country"
            value={country.code}
            onChange={(event) =>
              onChange({
                phoneCountry: event.target.value,
                phone: formatNationalInput(details.phone, findCountry(event.target.value)),
              })
            }
            className={soft ? undefined : fieldBox}
          >
            {PHONE_COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {countryLabel(item)}
              </option>
            ))}
          </select>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            inputMode="tel"
            required
            aria-required="true"
            autoComplete="tel-national"
            placeholder={country.dial === "1" ? "(305) 555-0187" : "Phone number"}
            value={details.phone}
            onChange={(event) =>
              onChange({ phone: formatNationalInput(event.target.value, country) })
            }
            onBlur={() => onBlurField("phone")}
            className={soft ? undefined : fieldBox}
            {...invalid("phone", ids.phone)}
          />
        </div>
      </Field>

      <Field soft={soft} id={ids.email} label="Email" error={errors.email} className={wide}>
        <input
          id={ids.email}
          name="email"
          type="email"
          inputMode="email"
          required
          aria-required="true"
          maxLength={200}
          autoComplete="email"
          value={details.email}
          onChange={(event) => onChange({ email: event.target.value })}
          onBlur={() => onBlurField("email")}
          className={box}
          {...invalid("email", ids.email)}
        />
      </Field>

      <Field soft={soft} id={ids.notes} label="Note" optional className={wide}>
        <textarea
          id={ids.notes}
          name="notes"
          rows={3}
          maxLength={500}
          value={details.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          className={box}
        />
      </Field>

      {/* Isca para robôs: invisível para pessoas, precisa ficar vazia. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={details.website}
        onChange={(event) => onChange({ website: event.target.value })}
        className={soft ? "ns-s-trap" : "absolute -left-[9999px] size-px opacity-0"}
      />

      <div className={soft ? "ns-s-consents" : `grid gap-3 ${wide}`}>
        <label
          htmlFor={ids.privacy}
          className={soft ? "ns-s-check" : "flex min-h-11 items-start gap-3 text-sm"}
        >
          <input
            id={ids.privacy}
            name="acceptedPrivacy"
            type="checkbox"
            required
            aria-required="true"
            checked={details.acceptPrivacy}
            onChange={(event) => onChange({ acceptPrivacy: event.target.checked })}
            className={soft ? undefined : "mt-0.5 size-6 shrink-0 accent-[var(--ns-primary)]"}
          />
          <span>
            I agree to the{" "}
            <a
              href={VISITOR_PRIVACY_URL}
              target="_blank"
              rel="noopener"
              className={soft ? "ns-s-link" : linkClass}
            >
              Privacy Policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        </label>

        {policy && (
          <>
            <div
              id={ids.policy}
              className={
                soft
                  ? "ns-s-policy"
                  : "rounded-lg border border-ns-border bg-ns-background p-4 text-sm"
              }
            >
              <p className={soft ? "ns-s-policy-title" : "font-semibold"}>Cancellation policy</p>
              <p className={soft ? undefined : "mt-1 whitespace-pre-line text-ns-muted"}>
                {policy}
              </p>
              {hoursText && (
                <p className={soft ? "ns-s-policy-hours" : "mt-2 font-medium"}>{hoursText}</p>
              )}
            </div>
            <label
              htmlFor={ids.cancel}
              className={soft ? "ns-s-check" : "flex min-h-11 items-start gap-3 text-sm"}
            >
              <input
                id={ids.cancel}
                name="acceptedCancellation"
                type="checkbox"
                required
                aria-required="true"
                aria-describedby={ids.policy}
                checked={details.acceptCancellation}
                onChange={(event) => onChange({ acceptCancellation: event.target.checked })}
                className={soft ? undefined : "mt-0.5 size-6 shrink-0 accent-[var(--ns-primary)]"}
              />
              <span>I agree to the cancellation policy</span>
            </label>
          </>
        )}

        {smsReminders && (
          // Consentimento para lembretes por texto: opcional, desmarcado e fora do "obrigatório".
          <label
            htmlFor={ids.sms}
            className={
              soft ? "ns-s-check ns-s-check--sms" : "flex min-h-11 items-start gap-3 text-sm"
            }
          >
            <input
              id={ids.sms}
              name="acceptedSms"
              type="checkbox"
              checked={details.acceptSms}
              onChange={(event) => onChange({ acceptSms: event.target.checked })}
              className={soft ? undefined : "mt-0.5 size-6 shrink-0 accent-[var(--ns-primary)]"}
            />
            <span>
              {`${smsConsentIntro(businessName)} See our `}
              <a
                href={VISITOR_PRIVACY_URL}
                target="_blank"
                rel="noopener"
                className={soft ? "ns-s-link" : linkClass}
              >
                Privacy Policy
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              .
            </span>
          </label>
        )}
      </div>
    </>
  );
}
