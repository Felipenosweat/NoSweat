"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAccount, requireAdmin } from "@/server/admin";
import { VIEW_AS_COOKIE, signViewAsToken, viewAsCookieOptions } from "@/server/auth/view-as-token";
import { extendExpiry, getGrantStore } from "@/server/billing";
import { getSocialStore } from "@/server/social/store";

// Ações do admin na página do cliente: liberar ou cortar o acesso pago à mão (Pix/WhatsApp),
// o testador do Instagram e o modo "ver como" (só leitura).

const GrantForm = z.object({
  plan: z.enum(["starter", "pro", "premium"]),
  days: z.coerce.number().int().min(1).max(3660),
  note: z.string().trim().max(200).optional(),
});

async function requireClient(userId: string) {
  const admin = await requireAdmin();
  if (!(await getAccount(userId))) throw new Error("Unknown client.");
  return admin;
}

function refresh(userId: string) {
  revalidatePath(`/admin/clients/${userId}`);
  revalidatePath("/admin");
}

/** Libera o plano por N dias (somando ao que ainda falta, se o acesso estiver valendo). */
export async function grantAccess(userId: string, formData: FormData): Promise<void> {
  const admin = await requireClient(userId);
  const input = GrantForm.parse({
    plan: formData.get("plan"),
    days: formData.get("days"),
    note: formData.get("note") || undefined,
  });
  const store = getGrantStore();
  const current = await store.get(userId);
  await store.upsert({
    userId,
    plan: input.plan,
    expiresAt: extendExpiry(current, input.days),
    note: input.note ?? current?.note ?? null,
    grantedBy: admin.id,
    updatedAt: new Date().toISOString(),
  });
  refresh(userId);
}

/** Corta o acesso manual na hora (o site sai do ar se não houver assinatura do Stripe). */
export async function revokeAccess(userId: string): Promise<void> {
  await requireClient(userId);
  await getGrantStore().remove(userId);
  refresh(userId);
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
  redirect("/dashboard");
}
