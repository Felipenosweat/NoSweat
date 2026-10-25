import { liveHref, siteAddress } from "@/server/admin/sites";
import type { SiteRecord } from "@/server/store";
import type { AdminSiteRow } from "./SitesTable";

// Converte um site do store na linha que a SitesTable (componente de cliente) recebe: só o que a
// tela mostra, nada do SiteSpec inteiro (que não precisa ir para o navegador).

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/**
 * Selo do site como o público vê: publicado de dono sem plano fica "temporarily unavailable" com
 * os planos valendo (ver ownerHasLiveAccess); com os planos desligados, avisa que sairia do ar.
 */
export function siteBadge(
  site: Pick<SiteRecord, "status">,
  opts: { withoutPlan: boolean; enforced: boolean },
): AdminSiteRow["badge"] {
  if (site.status !== "published") return { label: "Draft", tone: "draft" };
  if (opts.withoutPlan) {
    return { label: opts.enforced ? "Offline · no plan" : "Live · no plan", tone: "pending" };
  }
  return { label: "Live", tone: "live" };
}

export function toSiteRow(
  site: SiteRecord,
  opts: {
    owner: { label: string; test: boolean } | null;
    withoutPlan: boolean;
    enforced: boolean;
  },
): AdminSiteRow {
  return {
    id: site.id,
    name: site.spec.business.name,
    template: site.spec.template,
    published: site.status === "published",
    badge: siteBadge(site, opts),
    owner:
      site.ownerId === null
        ? null
        : {
            id: site.ownerId,
            label: opts.owner?.label ?? site.ownerId,
            test: opts.owner?.test ?? false,
          },
    address: siteAddress(site),
    liveHref: liveHref(site),
    created: dateFormat.format(new Date(site.createdAt)),
  };
}
