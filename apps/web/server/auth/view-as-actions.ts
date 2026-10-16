"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VIEW_AS_COOKIE } from "./view-as-token";
import { getViewer } from "./viewer";

/** Sai do modo "ver como": apaga o cookie e volta para a página da conta no /admin. */
export async function exitViewAs(): Promise<void> {
  const viewer = await getViewer();
  (await cookies()).delete(VIEW_AS_COOKIE);
  redirect(
    viewer?.viewingAs ? `/admin/clients/${encodeURIComponent(viewer.viewingAs.id)}` : "/dashboard",
  );
}
