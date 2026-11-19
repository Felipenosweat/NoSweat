"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireAdminRole } from "@/server/admin";
import { recordAdminAction } from "@/server/admin/audit";
import { normalizeTotpCode } from "@/server/admin/mfa";
import { createSupabaseServerClient } from "@/server/auth/session";

// Segundo passo do admin (TOTP do Supabase Auth): cadastrar o aplicativo autenticador e digitar
// o código que leva a sessão para AAL2. Fica fora do layout do /admin (que já exige AAL2).

export type EnrollState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "enrolling"; factorId: string; qrDataUrl: string; secret: string };

export type VerifyState = { error: string | null };

type Factor = { id: string; factor_type: string; status: string };

async function supabaseOrNull() {
  return createSupabaseServerClient();
}

/** Fatores TOTP da conta (verificados e não verificados). */
async function totpFactors(): Promise<Factor[] | null> {
  const supabase = await supabaseOrNull();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return null;
  return (data.all as Factor[]).filter((factor) => factor.factor_type === "totp");
}

/**
 * Começa o cadastro: apaga cadastros abandonados (não verificados) e pede um novo ao Supabase.
 * Devolve o QR e o segredo para o aplicativo autenticador. Se a conta já tem um autenticador,
 * recusa (trocar exige a sessão em AAL2 e é feito pelo painel do Supabase; ver DEPLOY.md).
 */
export async function startEnrollment(): Promise<EnrollState> {
  await requireAdminRole();
  const supabase = await supabaseOrNull();
  if (!supabase) return { status: "error", message: "Two-step verification needs Supabase." };
  const factors = await totpFactors();
  if (!factors) return { status: "error", message: "We couldn't read your account. Try again." };
  if (factors.some((factor) => factor.status === "verified")) {
    return { status: "error", message: "An authenticator is already set up. Reload the page." };
  }
  for (const factor of factors) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "No Sweat",
    friendlyName: `No Sweat admin ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error("[admin-mfa] could not enroll", error?.message);
    return { status: "error", message: "We couldn't start the setup. Try again." };
  }
  // O QR é gerado aqui a partir da URI (otpauth://), sem depender do formato do qr_code do
  // Supabase. O segredo aparece também em texto para quem não consegue ler o QR.
  const qrDataUrl = await QRCode.toDataURL(data.totp.uri, { margin: 1, width: 220 });
  return { status: "enrolling", factorId: data.id, qrDataUrl, secret: data.totp.secret };
}

/**
 * Confere o código de 6 dígitos (cadastro novo ou login). Certo: a sessão vira AAL2 (o Supabase
 * grava o cookie novo) e volta para o /admin.
 */
export async function verifyMfaCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const admin = await requireAdminRole();
  const code = normalizeTotpCode(formData.get("code"));
  if (!code) return { error: "Enter the 6-digit code from your authenticator app." };
  const supabase = await supabaseOrNull();
  const factors = await totpFactors();
  if (!supabase || !factors) return { error: "We couldn't read your account. Try again." };

  // Cadastro: o fator que acabou de ser criado (precisa ser desta conta). Login: o verificado.
  const requested = String(formData.get("factorId") ?? "");
  const verified = factors.find((factor) => factor.status === "verified");
  const factor = verified ?? factors.find((item) => item.id === requested);
  if (!factor) return { error: "Start the setup again." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: "That code didn't work. Check the time on your phone and try again." };

  await recordAdminAction({
    adminId: admin.id,
    action: verified ? "mfa.verify" : "mfa.enroll",
    targetType: "user",
    targetId: admin.id,
  });
  redirect("/admin");
}
