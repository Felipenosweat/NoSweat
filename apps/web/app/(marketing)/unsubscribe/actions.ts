"use server";

import { redirect } from "next/navigation";
import { getContactStore, isValidUnsubscribeToken } from "@/server/marketing";

/** Confirmação da página /unsubscribe. Volta para a mesma página com o resultado. */
export async function confirmUnsubscribe(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "");
  const params = new URLSearchParams({ email, token });
  if (!email || email.length > 254 || !isValidUnsubscribeToken(email, token)) {
    redirect(`/unsubscribe?${params.toString()}`);
  }
  try {
    await getContactStore().unsubscribe(email);
  } catch (error) {
    console.error("[marketing] unsubscribe failed", error);
    params.set("status", "error");
    redirect(`/unsubscribe?${params.toString()}`);
  }
  params.set("status", "done");
  redirect(`/unsubscribe?${params.toString()}`);
}
