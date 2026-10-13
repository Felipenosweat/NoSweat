"use server";

import { Credentials } from "@nosweat/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/server/auth/config";
import { isOAuthProvider } from "@/server/auth/providers";
import { createSupabaseServerClient } from "@/server/auth/session";
import { claimGuestSites } from "@/server/guest";

export type AuthFormState = { error?: string; message?: string };

function readCredentials(formData: FormData) {
  return Credentials.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
}

async function siteOrigin(): Promise<string> {
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

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next); // login desligado no dev local

  const input = readCredentials(formData);
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Invalid email or password." };

  const { data, error } = await supabase.auth.signInWithPassword(input.data);
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Please confirm your email first. Check your inbox for the link we sent."
          : "Invalid email or password.",
    };
  }
  if (data.user) await claimGuestSitesSafely(data.user.id);
  redirect(next);
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const input = readCredentials(formData);
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Please check your details." };

  const { data, error } = await supabase.auth.signUp({
    ...input.data,
    options: { emailRedirectTo: callbackUrl(await siteOrigin(), next) },
  });
  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "An account with this email already exists. Try logging in."
          : error.message,
    };
  }
  // Com "Confirm email" desligado no Supabase, a sessão já vem pronta.
  // Com a confirmação ligada, os sites são passados no /auth/callback (mesmo navegador).
  if (data.session) {
    if (data.user) await claimGuestSitesSafely(data.user.id);
    redirect(next);
  }
  return { message: "Almost there! Check your email and click the link to confirm your account." };
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
  redirect("/");
}
