import { cache, type ReactNode } from "react";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import type { PillBalance } from "@/lib/credits-ui";
import { tourConfig } from "@/lib/onboarding";
import { isAdminUser } from "@/server/admin";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { getSessionClaims } from "@/server/auth/session";
import { getViewer, type Viewer } from "@/server/auth/viewer";
import { ownerHasLiveAccess } from "@/server/billing";
import { getBalance } from "@/server/credits";
import { listOwnerSites } from "@/server/owner-sites";
import { liveSpec } from "@/server/sites";
import { brandFromSpec, type WorkspaceBrand } from "@/server/workspace-brand";
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
    // `list` já vem do mais recente para o mais antigo. Com dedupe: a página lê a mesma lista.
    const sites = await listOwnerSites(ownerId);
    const site = sites.find((s) => s.status === "published") ?? sites[0];
    return site?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Cara do painel: a cor e o nome do site do cliente (o publicado ou, sem nenhum no ar, o mais
 * recente), só enquanto o plano estiver em dia (`ownerHasLiveAccess`: sem planos valendo, todo
 * mundo). O admin no próprio painel fica com a marca No Sweat; no "ver como", vê a do cliente.
 * Erro = `null` (visual padrão).
 */
async function workspaceBrand(viewer: Viewer, admin: boolean): Promise<WorkspaceBrand | null> {
  if (admin && !viewer.viewingAs) return null;
  try {
    const sites = await listOwnerSites(viewer.ownerId);
    const site = sites.find((s) => s.status === "published") ?? sites[0];
    if (!site || !(await ownerHasLiveAccess(viewer.ownerId))) return null;
    return brandFromSpec(liveSpec(site));
  } catch (error) {
    console.error("[brand] could not read the site for the dashboard look", error);
    return null;
  }
}

/**
 * Saldo de créditos da IA para o "pill" do menu (conta dona dos dados: no "ver como", a vista).
 * Com `cache()` a leitura é uma só por request. Erro = `null`: o pill some, a página segue.
 */
const creditsFor = cache(async (ownerId: string): Promise<PillBalance | null> => {
  try {
    const balance = await getBalance({ id: ownerId });
    return {
      unlimited: balance.unlimited,
      total: balance.total,
      monthlyAllowance: balance.monthlyAllowance,
      resetsAt: balance.resetsAt,
    };
  } catch (error) {
    console.error("[credits] could not read the balance for the menu", error);
    return null;
  }
});

/**
 * `user_metadata` da sessão (as claims que o getCurrentUser já leu neste request), para saber se
 * a conta já viu o tour. Erro = `null` (o tour pode abrir; o localStorage evita repetir).
 */
async function sessionMetadata(): Promise<unknown> {
  try {
    return (await getSessionClaims())?.user_metadata ?? null;
  } catch {
    return null;
  }
}

/**
 * Link de ajuda do painel: WhatsApp de vendas (SALES_WHATSAPP, só dígitos) com uma mensagem
 * pronta e o e-mail da conta; sem ele, e-mail (SALES_EMAIL ou o e-mail público). Também usado
 * pelo /guide ("Message our team").
 */
export function supportHref(email: string | null): string {
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
  const viewingAs = viewer.viewingAs !== null;
  const [admin, latest, metadata, credits] = await Promise.all([
    isAdminUser(viewer.user),
    latestSiteId(viewer.ownerId),
    // No "ver como" o tour nunca abre sozinho: nem precisa ler a sessão.
    authEnabled && !viewingAs ? sessionMetadata() : Promise.resolve(null),
    creditsFor(viewer.ownerId),
  ]);
  const brand = await workspaceBrand(viewer, admin);
  const tour = tourConfig({ accountId: viewer.user.id, authEnabled, viewingAs, metadata });

  return (
    <DashboardChrome
      admin={admin}
      brand={brand}
      account={authEnabled ? { email: viewer.user.email } : null}
      latestSiteId={latest}
      supportHref={supportHref(viewer.user.email)}
      credits={credits}
      creditsReadOnly={viewingAs}
      banner={viewer.viewingAs ? <ViewAsBanner email={viewer.viewingAs.email} /> : null}
      tour={tour}
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
