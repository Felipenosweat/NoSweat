"use server";

import { Credentials } from "@nosweat/schema";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { confirmationErrors, profileMetadata, signUpSchema } from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { isOAuthProvider } from "@/server/auth/providers";
import { createSupabaseServerClient } from "@/server/auth/session";
import { VIEW_AS_COOKIE } from "@/server/auth/view-as-token";
import { claimGuestSites } from "@/server/guest";
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
};

const CAPTCHA_ERROR = "Please complete the security check and try again.";

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

/** Passa os sites feitos sem conta para a conta. Uma falha aqui nunca impede o login. */
async function claimGuestSitesSafely(userId: string): Promise<void> {
  try {
    await claimGuestSites(userId);
  } catch (error) {
    console.error("Could not move guest sites to the account", error);
  }
}

export async function signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next); // login desligado no dev local

  const attempt = nextAttempt(prev);
  const input = readCredentials(formData);
  if (!input.success)
    return { attempt, error: input.error.issues[0]?.message ?? "Invalid email or password." };

  const { data, error } = await supabase.auth.signInWithPassword({
    ...input.data,
    options: { captchaToken: captchaToken(formData) },
  });
  if (error) {
    return {
      attempt,
      error:
        error.code === "email_not_confirmed"
          ? "Please confirm your email first. Check your inbox for the link we sent."
          : error.code === "captcha_failed"
            ? CAPTCHA_ERROR
            : "Invalid email or password.",
    };
  }
  if (data.user) await claimGuestSitesSafely(data.user.id);
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
        error.code === "user_already_exists"
          ? "An account with this email already exists. Try logging in."
          : error.code === "captcha_failed"
            ? CAPTCHA_ERROR
            : error.code === "weak_password"
              ? "Please choose a stronger password."
              : error.message,
    };
  }
  // Passa os sites feitos sem conta AGORA, neste navegador: o link de confirmação muitas vezes
  // abre em outro (ex.: navegador do app de e-mail no celular), sem o cookie do visitante.
  // `identities` vazio = e-mail que já tinha conta (o Supabase devolve um usuário falso): aí não.
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    await claimGuestSitesSafely(data.user.id);
  }
  // Com "Confirm email" desligado no Supabase, a sessão já vem pronta: entra na lista agora.
  // Com confirmação ligada, isso acontece no /auth/callback (só depois de provar o e-mail).
  if (data.session && data.user) {
    joinLaunchListLater({
      userId: data.user.id,
      email: data.user.email ?? input.data.email,
      firstName: input.data.firstName,
      optedIn: input.data.marketing,
      origin: await siteOrigin(),
    });
    redirect(next);
  }
  return {
    attempt,
    message: "Almost there! Check your email and click the link to confirm your account.",
  };
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
