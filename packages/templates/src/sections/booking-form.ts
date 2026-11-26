import type { BookingSlot, CreateBookingRequest } from "@nosweat/schema";

// Regras puras do formulário de marcação: países do telefone, normalização para E.164, validação
// por país e montagem do corpo do POST. Sem biblioteca de telefone: lista pequena, escrita à mão.

export type PhoneCountry = {
  /** ISO 3166-1 alfa-2. */
  code: string;
  name: string;
  /** Código de discagem, sem o "+". */
  dial: string;
  /** Prefixo de tronco ("0") que se tira do número nacional ao montar o E.164. */
  trunkZero?: boolean;
};

export const DEFAULT_PHONE_COUNTRY = "US";

/** Estados Unidos primeiro; o resto em ordem alfabética. */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "US", name: "United States", dial: "1" },
  { code: "AR", name: "Argentina", dial: "54" },
  { code: "BR", name: "Brazil", dial: "55", trunkZero: true },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "CL", name: "Chile", dial: "56" },
  { code: "CO", name: "Colombia", dial: "57" },
  { code: "CR", name: "Costa Rica", dial: "506" },
  { code: "CU", name: "Cuba", dial: "53" },
  { code: "DO", name: "Dominican Republic", dial: "1" },
  { code: "EC", name: "Ecuador", dial: "593" },
  { code: "SV", name: "El Salvador", dial: "503" },
  { code: "FR", name: "France", dial: "33", trunkZero: true },
  { code: "DE", name: "Germany", dial: "49", trunkZero: true },
  { code: "GT", name: "Guatemala", dial: "502" },
  { code: "HN", name: "Honduras", dial: "504" },
  { code: "IN", name: "India", dial: "91", trunkZero: true },
  { code: "IT", name: "Italy", dial: "39" },
  { code: "MX", name: "Mexico", dial: "52" },
  { code: "NI", name: "Nicaragua", dial: "505" },
  { code: "PA", name: "Panama", dial: "507" },
  { code: "PE", name: "Peru", dial: "51" },
  { code: "PH", name: "Philippines", dial: "63", trunkZero: true },
  { code: "PT", name: "Portugal", dial: "351" },
  { code: "PR", name: "Puerto Rico", dial: "1" },
  { code: "ES", name: "Spain", dial: "34" },
  { code: "GB", name: "United Kingdom", dial: "44", trunkZero: true },
  { code: "VE", name: "Venezuela", dial: "58", trunkZero: true },
];

/** País pelo código; um código desconhecido cai nos Estados Unidos. */
export function findCountry(code: string): PhoneCountry {
  const fallback = PHONE_COUNTRIES[0] as PhoneCountry;
  return PHONE_COUNTRIES.find((country) => country.code === code) ?? fallback;
}

/** Rótulo do seletor: "United States +1". */
export function countryLabel(country: PhoneCountry): string {
  return `${country.name} +${country.dial}`;
}

/** Países do plano de numeração norte-americano: 10 dígitos depois do +1. */
function isNanp(country: PhoneCountry): boolean {
  return country.dial === "1";
}

const MAX_OTHER_DIGITS = 14;

/**
 * Só os dígitos nacionais do que a pessoa digitou. Tira o "+<código>" quando ela colou o número
 * inteiro, o "1" inicial dos EUA/Canadá e o zero de tronco dos países que o usam.
 */
export function nationalDigits(input: string, country: PhoneCountry): string {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.startsWith(country.dial)) {
    digits = digits.slice(country.dial.length);
  } else if (isNanp(country) && digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (country.trunkZero && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, isNanp(country) ? 10 : MAX_OTHER_DIGITS);
}

/** "(305) 555-0187" aos poucos, enquanto a pessoa digita (EUA/Canadá); outros países: só dígitos. */
export function formatNationalInput(input: string, country: PhoneCountry): string {
  const digits = nationalDigits(input, country);
  if (!isNanp(country)) return digits;
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export type PhoneCheck =
  | { ok: true; e164: string; national: string }
  | { ok: false; message: string };

/** Confere o tamanho por país (EUA/Canadá: 10 dígitos; outros: 6 a 14) e monta o E.164. */
export function checkPhone(input: string, country: PhoneCountry): PhoneCheck {
  const digits = nationalDigits(input, country);
  if (digits.length === 0) return { ok: false, message: "Please enter your phone number." };
  if (isNanp(country)) {
    if (digits.length !== 10) {
      return { ok: false, message: "Enter a 10-digit phone number, like (305) 555-0187." };
    }
  } else if (digits.length < 6 || digits.length > MAX_OTHER_DIGITS) {
    return { ok: false, message: "Enter a valid phone number for this country (6 to 14 digits)." };
  }
  return { ok: true, e164: `+${country.dial}${digits}`, national: digits };
}

export type BookingDetails = {
  firstName: string;
  lastName: string;
  /** Código ISO do país do telefone. */
  phoneCountry: string;
  /** Como a pessoa vê (já formatado nos EUA). */
  phone: string;
  email: string;
  notes: string;
  /** Campo-isca anti-robô. */
  website: string;
  acceptPrivacy: boolean;
  acceptCancellation: boolean;
  /** Caixa OPCIONAL de lembretes por texto (nunca vem marcada; só aparece com `smsReminders`). */
  acceptSms: boolean;
};

export const EMPTY_BOOKING_DETAILS: BookingDetails = {
  firstName: "",
  lastName: "",
  phoneCountry: DEFAULT_PHONE_COUNTRY,
  phone: "",
  email: "",
  notes: "",
  website: "",
  acceptPrivacy: false,
  acceptCancellation: false,
  acceptSms: false,
};

export type DetailErrors = Partial<Record<"firstName" | "lastName" | "phone" | "email", string>>;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmailShape(value: string): boolean {
  return value.length <= 200 && EMAIL_SHAPE.test(value);
}

/** Erros de cada campo (vazio = tudo certo). */
export function validateDetails(details: BookingDetails): DetailErrors {
  const errors: DetailErrors = {};
  if (!details.firstName.trim()) errors.firstName = "Please enter your first name.";
  if (!details.lastName.trim()) errors.lastName = "Please enter your last name.";
  const phone = checkPhone(details.phone, findCountry(details.phoneCountry));
  if (!phone.ok) errors.phone = phone.message;
  const email = details.email.trim();
  if (!email) errors.email = "Please enter your email.";
  else if (!isEmailShape(email)) errors.email = "Enter a valid email, like name@example.com.";
  return errors;
}

/** Só os erros que já podem aparecer: campo visitado (blur) ou envio já tentado. */
export function visibleErrors(
  errors: DetailErrors,
  blurred: Partial<Record<keyof DetailErrors, boolean>>,
  attempted: boolean,
): DetailErrors {
  const shown: DetailErrors = {};
  for (const key of ["firstName", "lastName", "phone", "email"] as const) {
    const message = errors[key];
    if (message && (attempted || blurred[key])) shown[key] = message;
  }
  return shown;
}

/** O botão só liga com o aceite da privacidade (e do cancelamento, se o dono escreveu a política). */
export function consentsGiven(details: BookingDetails, hasCancellationPolicy: boolean): boolean {
  return details.acceptPrivacy && (!hasCancellationPolicy || details.acceptCancellation);
}

/**
 * Corpo do `POST .../book`; `null` se algum campo ainda está inválido. `smsReminders` = o dono
 * usa lembretes por texto (a caixa existe): só então a marcação opcional vira `acceptedSms`.
 */
export function buildBookingBody(
  details: BookingDetails,
  pick: { serviceId: string; slot: BookingSlot },
  hasCancellationPolicy: boolean,
  smsReminders = false,
): CreateBookingRequest | null {
  if (Object.keys(validateDetails(details)).length > 0) return null;
  if (!consentsGiven(details, hasCancellationPolicy)) return null;
  const country = findCountry(details.phoneCountry);
  const phone = checkPhone(details.phone, country);
  if (!phone.ok) return null;
  const firstName = details.firstName.trim();
  const lastName = details.lastName.trim();
  return {
    serviceId: pick.serviceId,
    startAt: pick.slot.startAt,
    staffId: pick.slot.staffId,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    phone: phone.e164,
    phoneCountry: country.code,
    email: details.email.trim(),
    notes: details.notes.trim() || undefined,
    website: details.website,
    acceptedPrivacy: true,
    ...(hasCancellationPolicy ? { acceptedCancellation: true as const } : {}),
    ...(smsReminders && details.acceptSms ? { acceptedSms: true as const } : {}),
  };
}

/** "Cancel free up to 24 hours before" (só informativo; 0 ou ausente = sem frase). */
export function cancellationHoursText(hours: number | undefined): string | null {
  if (!hours || hours <= 0) return null;
  return `Cancel free up to ${hours} ${hours === 1 ? "hour" : "hours"} before.`;
}
