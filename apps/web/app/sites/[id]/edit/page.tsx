import type { Metadata } from "next";
import { headers } from "next/headers";
import { aiEnabled } from "@/server/ai";
import { ownerHasCustomDomainAccess, publishBlocked } from "@/server/billing";
import { creditCost, getBalance } from "@/server/credits";
import { getDomainState, makeSlug } from "@/server/domains";
import { remainingUses } from "@/server/quota";
import { freeUrl, hasUnpublishedChanges } from "@/server/sites";
import type { AiCredits } from "./AskAiPanel";
import { requireEditableSite } from "./guard";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website", robots: { index: false } };

type EditPageProps = { params: Promise<{ id: string }> };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const { actor, site } = await requireEditableSite(id);
  // Quantas mudanças por IA ainda cabem agora (créditos e limite diário; `null` = sem limite,
  // ex.: admins). Contas também veem o saldo de créditos (visitantes têm só o limite deles).
  const aiEditsLeft = await remainingUses(actor, "ai_edit");
  const balance = actor.kind === "user" ? await getBalance(actor.user) : null;
  const aiCredits: AiCredits | null =
    balance && !balance.unlimited
      ? { left: balance.total, cost: creditCost("ai_edit"), resetsAt: balance.resetsAt }
      : null;
  const origin = await requestOrigin();
  // Endereço grátis: o atual, ou o que o site vai receber ao publicar (mesmo makeSlug da API).
  // Antes da primeira publicação o editor recalcula com o nome digitado (origin + hasSlug).
  const freeAddress =
    freeUrl(site, origin) ?? `${origin}/s/${makeSlug(site.spec.business.name, site.id)}`;
  // Com os planos valendo e sem plano ativo, publicar leva para /billing: o modal avisa antes
  // (mesma regra da página do site; admins nunca precisam de plano). Visitante não publica.
  const needsPlan = actor.kind === "user" && (await publishBlocked(actor.user)) !== null;
  // Domínio próprio só vira o link de compartilhar quando JÁ funciona (como em /sites/[id]).
  // Se a consulta falhar, o editor abre do mesmo jeito (compartilha o endereço grátis).
  const domain =
    actor.kind === "user" && site.status === "published" && site.customDomain
      ? await getDomainState(site).catch(() => null)
      : null;
  const domainUrl =
    domain?.status === "active" && domain.domain && (await ownerHasCustomDomainAccess(site.ownerId))
      ? `https://${domain.domain}`
      : null;
  return (
    <SiteEditor
      siteId={site.id}
      initialSpec={site.spec}
      status={site.status === "published" ? "live" : "draft"}
      pendingChanges={hasUnpublishedChanges(site)}
      freeAddress={freeAddress}
      origin={origin}
      hasSlug={Boolean(site.slug)}
      updatedAt={site.updatedAt}
      hasDomain={Boolean(site.customDomain)}
      aiEditsLeft={aiEditsLeft}
      aiCredits={aiCredits}
      isGuest={actor.kind === "guest"}
      needsPlan={needsPlan}
      domainUrl={domainUrl}
      // Sem IA (produção sem chave): o editor esconde o pedido à IA e o "Rewrite with AI".
      aiEnabled={aiEnabled()}
    />
  );
}
