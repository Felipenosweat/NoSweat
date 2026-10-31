"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getAccount, requireAdmin } from "@/server/admin";
import { AccountAccessError, setLoginDisabled } from "@/server/admin/account-access";
import { revalidateAdmin } from "@/server/admin/cache";
import { VIEW_AS_COOKIE, signViewAsToken, viewAsCookieOptions } from "@/server/auth/view-as-token";
import { extendExpiry, getGrantStore, isGrantActive, PLANS } from "@/server/billing";
import { sameInstant } from "@/server/billing/grants";
import {
  accessAppUrl,
  accessEmailConfigured,
  sendAccessEmail,
  simpleHtml,
} from "@/server/notify/access-email";
import { adminAdjustCredits } from "@/server/credits";
import { getSocialStore } from "@/server/social/store";

// Ações do admin na página do cliente: liberar ou cortar o acesso pago à mão (Pix/WhatsApp),
// o testador do Instagram e o modo "ver como" (só leitura).

const GrantForm = z.object({
  plan: z.enum(["starter", "pro", "premium"]),
  // 0 dias só para trocar de plano sem mexer na data (conferido abaixo).
  days: z.coerce.number().int().min(0).max(3660),
  note: z.string().trim().max(200).optional(),
  // Data final que o admin estava vendo ("none" = sem acesso): evita somar os dias duas vezes.
  expected: z.string().trim().min(1).max(64),
});

/** Resposta das ações de acesso para o formulário (GrantAccessForm.tsx). */
export type GrantAccessState = { ok: boolean; message: string };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

async function requireClient(userId: string) {
  const admin = await requireAdmin();
  if (!(await getAccount(userId))) throw new Error("Unknown client.");
  return admin;
}

/** Limpa o cache do admin (contas, planos, números) e recarrega a ficha e as abas. */
function refresh(userId: string) {
  revalidateAdmin();
  revalidatePath(`/admin/clients/${userId}`);
  revalidatePath("/admin", "layout");
}

/** Histórico de notas no próprio campo: a nova (com a data) na frente das antigas. */
function withNote(entry: string, previous: string | null | undefined): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${today}: ${entry}${previous ? ` | ${previous}` : ""}`.slice(0, 1000);
}

/** Avisa o cliente por e-mail que o plano está ativo (depois da resposta; sem Resend, nada). */
function emailPlanActive(email: string | null, planName: string, expiresAt: string): void {
  if (!email || !accessEmailConfigured()) return;
  const appUrl = accessAppUrl();
  const paragraphs = [
    `Your No Sweat ${planName} plan is active until ${longDate.format(new Date(expiresAt))}.`,
    `Open your dashboard to publish your website: ${appUrl}/dashboard`,
    "Questions? Just reply to this email.",
    "No Sweat",
  ];
  const task = async () => {
    await sendAccessEmail(
      email,
      `Your No Sweat ${planName} plan is active`,
      paragraphs.join("\n\n"),
      simpleHtml(paragraphs),
    );
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

/**
 * Libera o plano por N dias (somando ao que ainda falta, se o acesso estiver valendo). Com 0 dias,
 * só troca o plano e mantém a data. Recusa se o acesso mudou desde que a página abriu (clique
 * duplo ou outra aba), para nunca somar os dias duas vezes.
 */
export async function grantAccess(
  userId: string,
  _prev: GrantAccessState,
  formData: FormData,
): Promise<GrantAccessState> {
  const admin = await requireClient(userId);
  const parsed = GrantForm.safeParse({
    plan: formData.get("plan"),
    days: formData.get("days"),
    note: formData.get("note") || undefined,
    expected: formData.get("expected"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the plan and the number of days (0 to 3660)." };
  }
  const input = parsed.data;
  const store = getGrantStore();
  const current = await store.get(userId);
  const unchanged =
    input.expected === "none" ? current === null : sameInstant(current?.expiresAt, input.expected);
  if (!unchanged) return { ok: false, message: "This account changed. Reload the page." };

  const activeGrant = isGrantActive(current) ? current : null;
  if (input.days === 0 && (!activeGrant || activeGrant.plan === input.plan)) {
    return {
      ok: false,
      message: activeGrant
        ? "Pick another plan to switch, or add at least 1 day."
        : "Add at least 1 day.",
    };
  }

  const expiresAt =
    input.days === 0 && activeGrant ? activeGrant.expiresAt : extendExpiry(current, input.days);
  await store.upsert({
    userId,
    plan: input.plan,
    expiresAt,
    note: input.note ? withNote(input.note, current?.note) : (current?.note ?? null),
    grantedBy: admin.id,
    updatedAt: new Date().toISOString(),
  });
  refresh(userId);
  console.info(
    `[admin] ${admin.id} granted ${input.plan} to ${userId} until ${expiresAt} (${input.days} day(s))`,
  );

  const planName = PLANS[input.plan].name;
  const account = await getAccount(userId);
  emailPlanActive(account?.email ?? null, planName, expiresAt);
  return {
    ok: true,
    message: `${planName} access until ${dateFormat.format(new Date(expiresAt))}.${
      account?.email && accessEmailConfigured()
        ? " We're emailing them that the plan is active."
        : ""
    }`,
  };
}

/**
 * Corta o acesso manual na hora (o site sai do ar se não houver assinatura do Stripe). Não apaga
 * a linha: a data final vira "agora", e o plano e as notas ficam como histórico.
 */
export async function revokeAccess(
  userId: string,
  _prev: GrantAccessState,
  _formData: FormData,
): Promise<GrantAccessState> {
  const admin = await requireClient(userId);
  const store = getGrantStore();
  const current = await store.get(userId);
  if (!isGrantActive(current)) {
    return { ok: false, message: "There is no manual access to remove. Reload the page." };
  }
  const now = new Date().toISOString();
  await store.upsert({
    userId,
    plan: current.plan,
    expiresAt: now,
    note: withNote("Access removed", current.note),
    grantedBy: admin.id,
    updatedAt: now,
  });
  refresh(userId);
  console.info(`[admin] ${admin.id} removed manual access from ${userId}`);
  return { ok: true, message: "Manual access removed." };
}

/** Liga/desliga o "testador" do Instagram (pode conectar enquanto o app da Meta está em teste). */
export async function toggleSocialTester(userId: string): Promise<void> {
  const admin = await requireClient(userId);
  const store = getSocialStore();
  const current = await store.getSettings(userId);
  const tester = !current.tester;
  await store.upsertSettings(userId, { tester });
  await store.logEvent({
    ownerId: userId,
    actorId: admin.id,
    action: "admin_set_tester",
    detail: { tester },
  });
  console.info(`[admin] ${admin.id} set Instagram tester=${tester} for ${userId}`);
  refresh(userId);
}

/**
 * "Ver como esta conta": grava o cookie `ns_view_as` (httpOnly, assinado, 1 hora) e abre o
 * painel com os dados dela. Só leitura: o proxy.ts recusa qualquer escrita na API até sair.
 */
export async function startViewAs(userId: string): Promise<void> {
  const admin = await requireClient(userId);
  if (userId === admin.id) redirect("/dashboard");
  const token = await signViewAsToken(admin.id, userId);
  (await cookies()).set(VIEW_AS_COOKIE, token, viewAsCookieOptions());
  console.info(`[admin] ${admin.id} started view-as for ${userId}`);
  redirect("/dashboard");
}

const LoginForm = z.object({ disabled: z.enum(["true", "false"]) });

/**
 * Desliga ou religa o login da conta (ban do Supabase Auth). Para contas de verdade é o jeito de
 * bloquear sem apagar dados. Nunca admins, nunca a própria conta (o servidor confere).
 */
export async function setLoginDisabledAction(
  userId: string,
  _prev: GrantAccessState,
  formData: FormData,
): Promise<GrantAccessState> {
  const admin = await requireAdmin();
  const parsed = LoginForm.safeParse({ disabled: formData.get("disabled") });
  if (!parsed.success) return { ok: false, message: "Invalid request. Reload the page." };
  const disabled = parsed.data.disabled === "true";
  try {
    const result = await setLoginDisabled(userId, admin.id, disabled);
    if (!result.ok) return { ok: false, message: result.error };
  } catch (error) {
    console.error("[admin] could not change the login", error);
    return {
      ok: false,
      message:
        error instanceof AccountAccessError ? error.message : "Something went wrong. Try again.",
    };
  }
  console.info(`[admin] ${admin.id} ${disabled ? "disabled" : "re-enabled"} login for ${userId}`);
  refresh(userId);
  return {
    ok: true,
    message: disabled
      ? "Login disabled. They can't log in anymore (an open session ends within an hour)."
      : "Login re-enabled. They can log in again.",
  };
}

const CreditForm = z.object({
  delta: z.coerce
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .refine((value) => value !== 0),
  note: z.string().trim().max(200).optional(),
});

/**
 * Ajusta os créditos da IA da conta (bônus, cortesia, compra por Pix): positivo soma créditos
 * comprados (não vencem), negativo tira (nunca abaixo de zero; ver adminAdjustCredits).
 */
export async function adjustCreditsAction(
  userId: string,
  _prev: GrantAccessState,
  formData: FormData,
): Promise<GrantAccessState> {
  const admin = await requireClient(userId);
  const parsed = CreditForm.safeParse({
    delta: formData.get("delta"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a whole number of credits other than 0 (use - to remove).",
    };
  }
  const { delta, note } = parsed.data;
  try {
    const balance = await adminAdjustCredits(userId, delta, note ?? null, admin.id);
    console.info(`[admin] ${admin.id} adjusted credits for ${userId} by ${delta}`);
    refresh(userId);
    return {
      ok: true,
      message: `${delta > 0 ? `Added ${delta}` : `Removed up to ${-delta}`} credits. Balance: ${balance.total} (${balance.monthlyLeft} monthly + ${balance.topup} purchased).`,
    };
  } catch (error) {
    console.error("[admin] could not adjust credits", error);
    return { ok: false, message: "We couldn't adjust the credits. Try again." };
  }
}
