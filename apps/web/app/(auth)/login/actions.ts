"use server";

import { Credentials } from "@nosweat/schema";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  confirmationErrors,
  PASSWORD_MIN,
  profileMetadata,
  signUpSchema,
} from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { isOAuthProvider } from "@/server/auth/providers";
import { createSupabaseServerClient } from "@/server/auth/session";
import { VIEW_AS_COOKIE } from "@/server/auth/view-as-token";
import { claimGuestSitesForUser, rememberGuestForSignup } from "@/server/guest";
import { joinLaunchListLater } from "@/server/marketing";

/** Valores que voltam para o formulário depois de um erro (nunca as senhas). */
export type SignUpValues = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  emailConfirm?: string;
  marketing?: boolean;
  terms?: boolean;
};

export type AuthFormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: SignUpValues;
  /** Conta os envios: troca o `key` do formulário e pede um captcha novo. */
  attempt?: number;
  /** Login recusado porque o e-mail ainda não foi confirmado: a tela oferece reenviar o link. */
  unconfirmedEmail?: string;
};

/** Estado dos formulários pequenos (reenviar confirmação, pedir nova senha). */
export type EmailFormState = {
  error?: string;
  message?: string;
  values?: { email?: string };
  attempt?: number;
};

const CAPTCHA_ERROR = "Please complete the security check and try again.";
const RATE_LIMIT_ERROR = "Too many attempts. Please wait a few minutes and try again.";
const EMAIL_LIMIT_ERROR =
  "We couldn’t send the email right now. Please try again in a few minutes.";
const INVALID_EMAIL_ERROR = "Please enter a valid email.";
const WEAK_PASSWORD_ERROR = `Please choose a stronger password: at least ${PASSWORD_MIN} characters with an uppercase letter, a lowercase letter, a number and a symbol, and not one you use on other sites.`;
const GENERIC_ERROR = "Something went wrong. Please try again in a minute.";
const LOGIN_ERROR = "Invalid email or password.";
const EXISTING_ACCOUNT_ERROR =
  "An account with this email already exists. Log in instead, or reset your password.";
const RESET_SENT = "If an account exists for that email, we sent you a link.";
const RESEND_SENT = "If that account is waiting for confirmation, we sent a new link.";

/** Erro do Supabase Auth (só o que importa para escolher a mensagem). */
type AuthErrorLike = { code?: string | undefined; status?: number | undefined; message: string };

/**
 * Mensagens dos erros que valem para qualquer formulário de conta. `null` = erro próprio do
 * formulário (quem chamou decide). Nunca mostra o texto cru do Supabase.
 */
function commonAuthError(error: AuthErrorLike): string | null {
  switch (error.code) {
    case "captcha_failed":
      return CAPTCHA_ERROR;
    case "over_request_rate_limit":
      return RATE_LIMIT_ERROR;
    case "over_email_send_rate_limit":
      return EMAIL_LIMIT_ERROR;
    case "email_address_invalid":
      return INVALID_EMAIL_ERROR;
    case "weak_password":
      return WEAK_PASSWORD_ERROR;
  }
  if (error.status === 429) return RATE_LIMIT_ERROR;
  return null;
}

/** Erro inesperado: registra no log e responde com a mensagem genérica. */
function unexpectedAuthError(where: string, error: AuthErrorLike): string {
  console.error(`[auth] ${where} failed`, error.code ?? "no_code", error.status, error.message);
  return GENERIC_ERROR;
}

/** Token do captcha (Turnstile), se o formulário mandou. */
function captchaToken(formData: FormData): string | undefined {
  const token = String(formData.get("captchaToken") ?? "");
  return token ? token : undefined;
}

const nextAttempt = (prev: AuthFormState) => (prev.attempt ?? 0) + 1;

function readCredentials(formData: FormData) {
  return Credentials.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
}

async function siteOrigin(): Promise<string> {
  // Em produção, o endereço oficial (não confia em cabeçalhos que vêm do cliente).
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function callbackUrl(origin: string, next: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim();
}

function signInError(error: AuthErrorLike): string {
  if (error.code === "invalid_credentials") return LOGIN_ERROR;
  const common = commonAuthError(error);
  if (common) return common;
  // Versões antigas do Supabase respondem senha errada com 400 sem `code`.
  if (!error.code && error.status === 400) return LOGIN_ERROR;
  return unexpectedAuthError("signIn", error);
}

export async function signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next); // login desligado no dev local

  const attempt = nextAttempt(prev);
  // O e-mail volta para o campo depois de um erro (o React limpa o formulário a cada envio).
  const values: SignUpValues = { email: readEmail(formData) };
  const input = readCredentials(formData);
  if (!input.success)
    return { attempt, values, error: input.error.issues[0]?.message ?? LOGIN_ERROR };

  const { data, error } = await supabase.auth.signInWithPassword({
    ...input.data,
    options: { captchaToken: captchaToken(formData) },
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        attempt,
        values,
        unconfirmedEmail: input.data.email,
        error: "Please confirm your email first. Check your inbox for the link we sent.",
      };
    }
    return { attempt, values, error: signInError(error) };
  }
  // Sites do cookie deste navegador e os guardados no cadastro (outro aparelho).
  if (data.user) await claimGuestSitesForUser(data.user);
  redirect(next);
}

export async function signUp(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const attempt = nextAttempt(prev);
  const text = (name: string) => String(formData.get(name) ?? "");
  const values: SignUpValues = {
    firstName: text("firstName").trim(),
    lastName: text("lastName").trim(),
    birthDate: text("birthDate"),
    email: text("email").trim(),
    emailConfirm: text("emailConfirm").trim(),
    marketing: formData.get("marketing") === "on",
    terms: formData.get("terms") === "on",
  };

  // Campo-isca preenchido = robô. Responde igual a um cadastro normal, sem criar nada.
  if (text("website")) {
    return {
      attempt,
      message: "Almost there! Check your email and click the link to confirm your account.",
    };
  }

  const input = signUpSchema().safeParse({
    ...values,
    password: text("password"),
    passwordConfirm: text("passwordConfirm"),
  });
  if (!input.success) {
    const fieldErrors: Record<string, string> = confirmationErrors({
      email: values.email ?? "",
      emailConfirm: values.emailConfirm ?? "",
      password: text("password"),
      passwordConfirm: text("passwordConfirm"),
    });
    for (const issue of input.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return {
      attempt,
      values,
      fieldErrors,
      error: "Please fix the highlighted fields.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: {
      emailRedirectTo: callbackUrl(await siteOrigin(), next),
      captchaToken: captchaToken(formData),
      // Nome, data de nascimento e opt-in de marketing ficam na conta (user_metadata).
      data: { ...profileMetadata(input.data), terms_accepted_at: new Date().toISOString() },
    },
  });
  if (error) {
    return {
      attempt,
      values,
      error:
        error.code === "user_already_exists" || error.code === "email_exists"
          ? EXISTING_ACCOUNT_ERROR
          : (commonAuthError(error) ?? unexpectedAuthError("signUp", error)),
    };
  }
  // `identities` vazio = e-mail que já tem conta confirmada: o Supabase devolve um usuário falso
  // e não manda e-mail nenhum. Avisa em vez de mandar a pessoa esperar um e-mail que não vem.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { attempt, values, error: EXISTING_ACCOUNT_ERROR };
  }
  // Com "Confirm email" desligado no Supabase, a sessão já vem pronta: passa os sites e entra na
  // lista agora. Com confirmação ligada, isso acontece no /auth/callback (só depois de provar o
  // e-mail): aqui só guardamos o id do visitante na conta, e os sites continuam dele até lá.
  if (data.session && data.user) {
    await claimGuestSitesForUser(data.user);
    joinLaunchListLater({
      userId: data.user.id,
      email: data.user.email ?? input.data.email,
      firstName: input.data.firstName,
      optedIn: input.data.marketing,
      origin: await siteOrigin(),
    });
    redirect(next);
  }
  if (data.user) await rememberGuestForSignup(data.user.id);
  return {
    attempt,
    message: "Almost there! Check your email and click the link to confirm your account.",
  };
}

const EmailInput = z.email().max(254);

/**
 * Reenvia o link de confirmação do cadastro. Responde sempre igual (não revela se o e-mail tem
 * conta), menos quando o captcha ou o limite de envios impedem o envio.
 */
export async function resendConfirmation(
  prev: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const attempt = nextAttempt(prev);
  const email = readEmail(formData);
  const values = { email };
  if (!EmailInput.safeParse(email).success) {
    return { attempt, values, error: INVALID_EMAIL_ERROR };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: callbackUrl(await siteOrigin(), next),
      captchaToken: captchaToken(formData),
    },
  });
  if (error) {
    const common = commonAuthError(error);
    if (common) return { attempt, values, error: common };
    // Outros erros (ex.: conta já confirmada) não aparecem: a resposta é a mesma de sempre.
    console.error("[auth] resend failed", error.code ?? "no_code", error.status, error.message);
  }
  return { attempt, values, message: RESEND_SENT };
}

/**
 * "Forgot password?": manda o link para escolher uma senha nova. O link passa pelo
 * /auth/callback e cai em /reset-password já com a sessão de recuperação.
 * Responde sempre igual (não revela se o e-mail tem conta).
 */
export async function requestPasswordReset(
  prev: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/dashboard"); // login desligado no dev local

  const attempt = nextAttempt(prev);
  const email = readEmail(formData);
  const values = { email };
  if (!EmailInput.safeParse(email).success) {
    return { attempt, values, error: INVALID_EMAIL_ERROR };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(await siteOrigin(), "/reset-password"),
    captchaToken: captchaToken(formData),
  });
  if (error) {
    const common = commonAuthError(error);
    if (common) return { attempt, values, error: common };
    console.error(
      "[auth] password reset failed",
      error.code ?? "no_code",
      error.status,
      error.message,
    );
  }
  return { attempt, values, message: RESET_SENT };
}

/**
 * Login social (Google/Apple) pelo Supabase OAuth. O formulário manda `provider`, `next` e
 * `from` (a página de origem, para voltar com `?error=oauth` se algo der errado).
 */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get("next"));
  const from = formData.get("from") === "signup" ? "/signup" : "/login";
  const provider = formData.get("provider");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const failure = `${from}?error=oauth&next=${encodeURIComponent(next)}`;
  if (!isOAuthProvider(provider)) redirect(failure);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(await siteOrigin(), next) },
  });
  if (error || !data.url) redirect(failure);
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  // Sai também do modo "ver como" do admin (o cookie não serve para mais ninguém).
  (await cookies()).delete(VIEW_AS_COOKIE);
  redirect("/");
}
