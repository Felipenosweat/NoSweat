import { PriceItemResponse, UpdatePriceItemRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deletePriceItem, updatePriceItem } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/office/price-items/[id]: muda o item (ou desativa com `active: false`). */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/price-items/[id]", async (user) => {
    const { id } = await params;
    const input = await readJson(request, UpdatePriceItemRequest);
    if (!input.ok) return input.response;
    const item = await updatePriceItem(user.id, id, input.data);
    if (!item) return notFound("Price item");
    return jsonResponse(PriceItemResponse, { item });
  });
}

/** DELETE /api/office/price-items/[id] → { ok: true }. Documentos antigos não mudam. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/price-items/[id]", async (user) => {
    const { id } = await params;
    if (!(await deletePriceItem(user.id, id))) return notFound("Price item");
    return Response.json({ ok: true });
  });
}
