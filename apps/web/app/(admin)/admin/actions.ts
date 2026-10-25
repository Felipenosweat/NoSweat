"use server";

import type { PlanId } from "@nosweat/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin";
import {
  DeleteSitesInput,
  GuestCleanupInput,
  UnpublishSiteInput,
  adminDeleteGuestDrafts,
  adminDeleteSites,
  adminUnpublishSite,
} from "@/server/admin/sites";
import {
  TestAccountError,
  createTestAccount,
  deleteAccount,
  deleteTestAccount,
} from "@/server/admin/test-accounts";

// Ações do admin no /admin: criar contas de teste e apagar contas (de teste ou a pedido do
// cliente). Cada ação confere de novo se quem chama é admin (Server Actions podem ser chamadas
// direto, sem passar pela página).

export type CreateTestAccountState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "created"; userId: string; email: string; password: string; plan: PlanId | null };

function planFrom(value: FormDataEntryValue | null): PlanId | null {
  return value === "starter" || value === "pro" || value === "premium" ? value : null;
}

/** Cria a conta de teste. A senha volta só nesta resposta (a tela mostra uma vez). */
export async function createTestAccountAction(
  _prev: CreateTestAccountState,
  formData: FormData,
): Promise<CreateTestAccountState> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  try {
    const created = await createTestAccount(
      { email: email || undefined, plan: planFrom(formData.get("plan")) },
      admin.id,
    );
    console.info(`[admin] ${admin.id} created test account ${created.userId}`);
    revalidatePath("/admin");
    return { status: "created", ...created };
  } catch (error) {
    if (error instanceof TestAccountError) return { status: "error", message: error.message };
    console.error("[admin] could not create a test account", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}

export type DeleteAccountState = { error: string | null };

/**
 * Apaga uma conta pelo painel: conta de teste (depois de digitar DELETE) ou conta de verdade que
 * pediu a exclusão (depois de digitar o e-mail dela). Admins e a própria conta: recusa. Os sites
 * saem antes, pelo mesmo caminho do DELETE /api/sites/[id] (domínios liberados na Vercel).
 */
export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const testAccount = formData.get("kind") === "test";
  if (testAccount && String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  let email: string | null = null;
  try {
    // Conta de teste: só a de teste passa (o servidor confere a marca de novo). Conta de verdade:
    // o e-mail digitado precisa bater com o da conta.
    const result = testAccount
      ? await deleteTestAccount(userId, admin.id)
      : await deleteAccount(userId, admin.id, {
          confirmEmail: String(formData.get("confirmEmail") ?? ""),
        });
    if (!result.ok) return { error: result.error };
    email = result.email;
    console.info(
      `[admin] ${admin.id} deleted ${testAccount ? "test " : ""}account ${userId} and ${result.sitesDeleted} site(s)`,
    );
  } catch (error) {
    console.error("[admin] could not delete the account", error);
    return {
      error: error instanceof TestAccountError ? error.message : "Something went wrong. Try again.",
    };
  }

  revalidatePath("/admin");
  // `redirect` fora do try (ele lança um erro de propósito para navegar).
  redirect(`/admin?deleted=${encodeURIComponent(email ?? "account")}#accounts`);
}

// ---------- sites ----------

/** Resposta das ações de sites para a tela (SitesTable, GuestCleanup). */
export type AdminActionResult = { ok: boolean; message: string };

/** Recarrega o /admin e as fichas das contas (os sites aparecem nas duas). */
function refreshAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard");
}

function firstIssue(error: { issues: { message: string }[] }, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

/** Tira o site do ar (como POST /api/sites/[id]/unpublish): nada é apagado. */
export async function unpublishSiteAction(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = UnpublishSiteInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid website." };
  try {
    const result = await adminUnpublishSite(parsed.data.siteId);
    if (!result.ok) return { ok: false, message: result.error };
    console.info(`[admin] ${admin.id} took site ${parsed.data.siteId} offline`);
    refreshAdmin();
    return {
      ok: true,
      message: result.alreadyOffline
        ? `${result.name} was already offline.`
        : `${result.name} is offline. Publishing again brings it back as it was.`,
    };
  } catch (error) {
    console.error("[admin] could not take the site offline", error);
    return { ok: false, message: "We couldn't take the website offline. Try again." };
  }
}

/**
 * Apaga um ou mais sites para sempre, pelo mesmo caminho do DELETE /api/sites/[id] (domínio
 * liberado na Vercel, versões e mensagens em cascata).
 */
export async function deleteSitesAction(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = DeleteSitesInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error, "Invalid selection.") };
  }
  try {
    const result = await adminDeleteSites(parsed.data.siteIds);
    console.info(
      `[admin] ${admin.id} deleted ${result.deleted.length} site(s): ${result.deleted
        .map((site) => site.id)
        .join(", ")}${result.failed.length ? ` (failed: ${result.failed.join(", ")})` : ""}`,
    );
    if (result.deleted.length > 0 || result.missing.length > 0) refreshAdmin();
    const done =
      result.deleted.length === 1
        ? `Deleted ${result.deleted[0]?.name ?? "the website"}.`
        : `Deleted ${result.deleted.length} websites.`;
    if (result.failed.length > 0) {
      return {
        ok: false,
        message: `${result.deleted.length > 0 ? `${done} ` : ""}${result.failed.length} could not be deleted. Try again.`,
      };
    }
    if (result.deleted.length === 0) {
      return { ok: false, message: "These websites no longer exist. Reload the page." };
    }
    return { ok: true, message: done };
  } catch (error) {
    console.error("[admin] could not delete the sites", error);
    return { ok: false, message: "We couldn't delete the websites. Try again." };
  }
}

/** Apaga os rascunhos de visitantes (sem conta) mais velhos que N dias (a faxina do cron). */
export async function deleteGuestDraftsAction(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = GuestCleanupInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error, "Check the number of days.") };
  }
  const { days } = parsed.data;
  try {
    const deleted = await adminDeleteGuestDrafts(days);
    console.info(`[admin] ${admin.id} deleted ${deleted} guest draft(s) older than ${days} day(s)`);
    refreshAdmin();
    return {
      ok: true,
      message:
        deleted === 0
          ? `No guest drafts older than ${days} ${days === 1 ? "day" : "days"}.`
          : `Deleted ${deleted} guest ${deleted === 1 ? "draft" : "drafts"} older than ${days} ${days === 1 ? "day" : "days"}.`,
    };
  } catch (error) {
    console.error("[admin] could not delete guest drafts", error);
    return { ok: false, message: "We couldn't delete the guest drafts. Try again." };
  }
}
