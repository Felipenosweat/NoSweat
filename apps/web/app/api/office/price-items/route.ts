import { CreatePriceItemRequest, PriceItemResponse, PriceItemsResponse } from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { createPriceItem, listPriceItems } from "@/server/office/service";

/** GET /api/office/price-items: tabela de preços (ativos e inativos), por nome. */
export async function GET(): Promise<Response> {
  return ownerRoute("/api/office/price-items", async (user) => {
    const items = await listPriceItems(user.id);
    return jsonResponse(PriceItemsResponse, { items });
  });
}

/** POST /api/office/price-items: item novo (ativo). */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/price-items", async (user) => {
    const input = await readJson(request, CreatePriceItemRequest);
    if (!input.ok) return input.response;
    const item = await createPriceItem(user.id, input.data);
    return jsonResponse(PriceItemResponse, { item }, 201);
  });
}
