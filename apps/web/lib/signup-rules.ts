import { z } from "zod";

// Regras do cadastro, usadas na tela (dicas ao vivo) e no servidor (validação de verdade).
// Idade mínima: 18. Os Termos e a Política de Privacidade já exigem 18 anos (serviço para
// empresas, com contrato e pagamento). A COPPA (13 anos) é só o piso; 18 cobre os dois.

export const MIN_AGE = 18;
/** Ninguém tem mais que isso: pega datas digitadas erradas (ex.: ano 1026). */
const MAX_AGE = 120;

export const PASSWORD_MIN = 10;
/** Limite do bcrypt usado pelo Supabase. */
export const PASSWORD_MAX = 72;

/** Cada requisito da senha, na ordem em que aparece na tela. */
export const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN} characters`,
    test: (p: string) => p.length >= PASSWORD_MIN,
  },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /\p{Lu}/u.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /\p{Ll}/u.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  {
    id: "special",
    label: "One symbol (like ! @ # $)",
    test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p),
  },
] as const;

export function passwordProblems(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

/**
 * Idade completa em `today` para uma data "AAAA-MM-DD" (a do <input type="date">).
 * `null` se a data não existe (ex.: 2001-02-30) ou está fora do formato.
 */
export function ageOn(birthDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  let age = today.getUTCFullYear() - year;
  const beforeBirthday =
    today.getUTCMonth() < month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Please enter your ${label}.`)
    .max(60, `Your ${label} is too long.`)
    // Letras de qualquer idioma, espaço, hífen, apóstrofo e ponto (ex.: "Mary-Jane", "O'Neil", "Jr.").
    .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u, `Please use only letters in your ${label}.`);

/** Data de nascimento: existe, não é no futuro e a pessoa tem pelo menos MIN_AGE anos. */
export function birthDateSchema(today: () => Date = () => new Date()) {
  return z.string().superRefine((value, ctx) => {
    const age = ageOn(value, today());
    if (age === null || age < 0 || age > MAX_AGE) {
      ctx.addIssue({ code: "custom", message: "Please enter a valid date of birth." });
    } else if (age < MIN_AGE) {
      ctx.addIssue({
        code: "custom",
        message: `You must be at least ${MIN_AGE} years old to create an account.`,
      });
    }
  });
}

/** Dados do perfil (cadastro por e-mail e o passo "complete your profile" do login social). */
export function profileSchema(today?: () => Date) {
  return z.object({
    firstName: name("first name"),
    lastName: name("last name"),
    birthDate: birthDateSchema(today),
    marketing: z.boolean(),
  });
}

/** Senha forte: cada requisito que falta vira uma mensagem só. */
const strongPassword = z
  .string()
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`)
  .superRefine((password, ctx) => {
    const problems = passwordProblems(password);
    if (problems.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Your password needs: ${problems.join(", ").toLowerCase()}.`,
      });
    }
  });

/**
 * Formulário de cadastro por e-mail e senha. As confirmações (e-mail e senha iguais) ficam
 * no próprio campo de confirmação, para TODOS os erros aparecerem de uma vez (um refine no
 * objeto só rodaria depois de todos os outros campos estarem certos).
 */
export function signUpSchema(today?: () => Date) {
  return z
    .object({
      email: z.email("Please enter a valid email address.").max(254),
      emailConfirm: z.string(),
      password: strongPassword,
      passwordConfirm: z.string(),
      terms: z.literal(true, {
        error: "Please agree to the Terms of Service and Privacy Policy.",
      }),
    })
    .extend(profileSchema(today).shape)
    .superRefine((data, ctx) => {
      if (data.email.trim().toLowerCase() !== data.emailConfirm.trim().toLowerCase()) {
        ctx.addIssue({
          code: "custom",
          path: ["emailConfirm"],
          message: "The emails don’t match.",
        });
      }
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirm"],
          message: "The passwords don’t match.",
        });
      }
    });
}

/** Confirmações que não dependem dos outros campos estarem certos (para mostrar tudo junto). */
export function confirmationErrors(values: {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.email.trim().toLowerCase() !== values.emailConfirm.trim().toLowerCase()) {
    errors.emailConfirm = "The emails don’t match.";
  }
  if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = "The passwords don’t match.";
  }
  return errors;
}

export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;
export type ProfileInput = z.infer<ReturnType<typeof profileSchema>>;

/** Metadados gravados na conta do Supabase (user_metadata). Nomes em snake_case, como no Supabase. */
export type ProfileMetadata = {
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  marketing_opt_in: boolean;
  profile_completed_at: string;
};

export function profileMetadata(input: ProfileInput, now: Date = new Date()): ProfileMetadata {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    full_name: `${input.firstName} ${input.lastName}`,
    birth_date: input.birthDate,
    marketing_opt_in: input.marketing,
    profile_completed_at: now.toISOString(),
  };
}

/** O perfil está completo (tem nome e data de nascimento)? Lê os claims/user_metadata do Supabase. */
export function hasCompleteProfile(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as Record<string, unknown>;
  return (
    typeof m.birth_date === "string" &&
    m.birth_date.length > 0 &&
    typeof m.first_name === "string" &&
    m.first_name.length > 0
  );
}

/** Data máxima aceita no <input type="date"> (quem nasceu nela faz MIN_AGE hoje). */
export function latestBirthDate(today: Date = new Date()): string {
  const d = new Date(
    Date.UTC(today.getUTCFullYear() - MIN_AGE, today.getUTCMonth(), today.getUTCDate()),
  );
  return d.toISOString().slice(0, 10);
}
