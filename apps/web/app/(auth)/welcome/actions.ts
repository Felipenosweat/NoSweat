"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { profileMetadata, profileSchema } from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { joinLaunchListLater } from "@/server/marketing";

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    marketing?: boolean;
    terms?: boolean;
  };
  attempt?: number;
};

async function origin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Passo "Complete your profile": nome, data de nascimento (18+), aceite dos termos e marketing. */
export async function completeProfile(
  prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const attempt = (prev.attempt ?? 0) + 1;
  const text = (name: string) => String(formData.get(name) ?? "");
  const values = {
    firstName: text("firstName").trim(),
    lastName: text("lastName").trim(),
    birthDate: text("birthDate"),
    marketing: formData.get("marketing") === "on",
    terms: formData.get("terms") === "on",
  };

  const input = profileSchema().safeParse(values);
  const fieldErrors: Record<string, string> = {};
  if (!input.success) {
    for (const issue of input.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  if (!values.terms) {
    fieldErrors.terms = "Please agree to the Terms of Service and Privacy Policy.";
  }
  if (!input.success || Object.keys(fieldErrors).length > 0) {
    return { attempt, values, fieldErrors, error: "Please fix the highlighted fields." };
  }

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data, error } = await supabase.auth.updateUser({
    data: { ...profileMetadata(input.data), terms_accepted_at: new Date().toISOString() },
  });
  if (error || !data.user) {
    return { attempt, values, error: "We couldn't save your details. Please try again." };
  }
  // Sessão nova: o token passa a trazer o perfil completo (o proxy confere por ele).
  await supabase.auth.refreshSession();

  joinLaunchListLater({
    userId: data.user.id,
    email: data.user.email ?? null,
    firstName: input.data.firstName,
    optedIn: input.data.marketing,
    origin: await origin(),
  });
  redirect(next);
}
