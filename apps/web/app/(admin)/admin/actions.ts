"use server";

import type { PlanId } from "@nosweat/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin";
import {
  TestAccountError,
  createTestAccount,
  deleteTestAccount,
} from "@/server/admin/test-accounts";

// Ações do admin no /admin: criar e apagar contas de teste. Cada ação confere de novo se quem
// chama é admin (Server Actions podem ser chamadas direto, sem passar pela página).

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
    revalidatePath("/admin");
    return { status: "created", ...created };
  } catch (error) {
    if (error instanceof TestAccountError) return { status: "error", message: error.message };
    console.error("[admin] could not create a test account", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}

export type DeleteTestAccountState = { error: string | null };

/** Apaga uma conta de teste (só depois de digitar DELETE). Contas de verdade e admins: recusa. */
export async function deleteTestAccountAction(
  _prev: DeleteTestAccountState,
  formData: FormData,
): Promise<DeleteTestAccountState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  let email: string | null = null;
  try {
    const result = await deleteTestAccount(userId, admin.id);
    if (!result.ok) return { error: result.error };
    email = result.email;
  } catch (error) {
    console.error("[admin] could not delete the test account", error);
    return {
      error: error instanceof TestAccountError ? error.message : "Something went wrong. Try again.",
    };
  }

  revalidatePath("/admin");
  // `redirect` fora do try (ele lança um erro de propósito para navegar).
  redirect(`/admin?deleted=${encodeURIComponent(email ?? "account")}#accounts`);
}
