import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import { isAdminUser } from "@/server/admin";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { getViewer, type Viewer } from "@/server/auth/viewer";
import { getSiteStore } from "@/server/store";
import { DashboardChrome } from "./DashboardChrome";

// Moldura do painel (barra lateral + abas do celular) para quem tem conta. Usada pelo layout do
// /dashboard e também pela página de um site (/sites/[id]), que fica fora do grupo (dashboard)
// mas precisa da mesma navegação para o cliente nunca ficar sem caminho de volta.

/**
 * Site do atalho "Messages": o publicado (é nele que chegam os pedidos do formulário) ou, sem
 * nenhum no ar, o mais recente. Erro no banco = sem atalho.
 */
async function latestSiteId(ownerId: string): Promise<string | null> {
  try {
    // `list` já vem do mais recente para o mais antigo.
    const sites = await getSiteStore().list(ownerId);
    const site = sites.find((s) => s.status === "published") ?? sites[0];
    return site?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Link de ajuda do painel: WhatsApp de vendas (SALES_WHATSAPP, só dígitos) com uma mensagem
 * pronta e o e-mail da conta; sem ele, e-mail (SALES_EMAIL ou o e-mail público).
 */
function supportHref(email: string | null): string {
  const whatsapp = process.env.SALES_WHATSAPP?.replace(/\D/g, "");
  if (whatsapp) {
    const message = email
      ? `Hi, I need help with my No Sweat account (${email})`
      : "Hi, I need help with my No Sweat account";
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  }
  return `mailto:${process.env.SALES_EMAIL || CONTACT_EMAIL}`;
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
      supportHref={supportHref(viewer.user.email)}
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
