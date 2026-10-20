import {
  DeleteSiteResponse,
  GetSiteResponse,
  UpdateSiteRequest,
  UpdateSiteResponse,
} from "@nosweat/schema";
import { savesExceeded } from "@/server/quota";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import {
  deleteSiteForever,
  hasUnpublishedChanges,
  requireOwnedSite,
  requireSiteAccess,
} from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id] → { siteId, spec, status } */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    // Site de outra pessoa responde 404, igual a um que não existe.
    if (!site) return notFound();
    return jsonResponse(GetSiteResponse, {
      siteId: site.id,
      spec: site.spec,
      status: site.status,
      publishedSpec: site.publishedSpec,
      hasUnpublishedChanges: hasUnpublishedChanges(site),
    });
  });
}

/** Os dois horários são o mesmo instante? (O banco pode escrever o fuso de outro jeito.) */
function sameInstant(a: string, b: string): boolean {
  if (a === b) return true;
  const left = Date.parse(a);
  const right = Date.parse(b);
  return Number.isFinite(left) && left === right;
}

/**
 * PATCH /api/sites/[id]: { spec, baseUpdatedAt? } → { siteId, spec, updatedAt }. Salva o
 * RASCUNHO (o site no ar não muda). Com `baseUpdatedAt` diferente do atual, o site mudou em
 * outra aba ou aparelho: 409 "conflict" em vez de sobrescrever o trabalho mais novo.
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site: current } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    if (!current) return notFound();

    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;

    const base = input.data.baseUpdatedAt;
    if (base && !sameInstant(base, current.updatedAt)) {
      return errorResponse(
        409,
        "conflict",
        "This site was changed in another tab or device. Reload to get the latest version.",
      );
    }

    const tooFast = await savesExceeded(current.id);
    if (tooFast) return tooFast;

    const site = await getSiteStore().update(id, input.data.spec, "edit");
    if (!site) return notFound();
    return jsonResponse(UpdateSiteResponse, {
      siteId: site.id,
      spec: site.spec,
      updatedAt: site.updatedAt,
    });
  });
}

/**
 * DELETE /api/sites/[id] → { siteId, deleted: true }. Apaga o site para sempre (sai do ar,
 * libera o domínio próprio e some com versões e mensagens). Não usa a IA: não gasta créditos.
 */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    if (!(await deleteSiteForever(site))) return notFound();
    return jsonResponse(DeleteSiteResponse, { siteId: site.id, deleted: true });
  });
}
