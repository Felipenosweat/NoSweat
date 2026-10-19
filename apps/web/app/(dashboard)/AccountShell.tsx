import type { ReactNode } from "react";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import { isAdminUser } from "@/server/admin";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { getViewer, type Viewer } from "@/server/auth/viewer";
import { getSiteStore } from "@/server/store";
import { DashboardChrome } from "./DashboardChrome";

// Moldura do painel (barra lateral + abas do celular) para quem tem conta. Usada pelo layout do
// /dashboard e também pela página de um site (/sites/[id]), que fica fora do grupo (dashboard)
// mas precisa da mesma navegação para o cliente nunca ficar sem caminho de volta.

/** Id do site mais recente da conta (atalho "Messages"). Erro no banco = sem atalho. */
async function latestSiteId(ownerId: string): Promise<string | null> {
  try {
    // `list` já vem do mais recente para o mais antigo.
    const [latest] = await getSiteStore().list(ownerId);
    return latest?.id ?? null;
  } catch {
    return null;
  }
}

export async function AccountShell({
  viewer,
  children,
}: {
  /** Quem está vendo (conta logada). */
  viewer: Viewer;
  children: ReactNode;
}) {
  // Com login desligado (dev local) todo mundo é o DEV_USER: sem e-mail nem "Log out".
  const authEnabled = getSupabaseAuthConfig() !== null;
  const [admin, latest] = await Promise.all([
    isAdminUser(viewer.user),
    latestSiteId(viewer.ownerId),
  ]);

  return (
    <DashboardChrome
      admin={admin}
      account={authEnabled ? { email: viewer.user.email } : null}
      latestSiteId={latest}
      banner={viewer.viewingAs ? <ViewAsBanner email={viewer.viewingAs.email} /> : null}
    >
      {children}
    </DashboardChrome>
  );
}

/** Atalho para páginas fora do grupo (dashboard): busca o `Viewer` e monta a moldura. */
export async function AccountShellForCurrentViewer({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) return <>{children}</>;
  return <AccountShell viewer={viewer}>{children}</AccountShell>;
}
