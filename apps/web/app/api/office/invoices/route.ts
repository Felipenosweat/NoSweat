import {
  CreateInvoiceRequest,
  InvoiceResponse,
  InvoiceStatus,
  InvoicesResponse,
} from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute, queryParam } from "@/server/office/api";
import { createInvoice, listInvoices } from "@/server/office/service";

/** GET /api/office/invoices?status=&clientId=: faturas, mais novas primeiro. */
export async function GET(request: Request): Promise<Response> {
  return ownerRoute("/api/office/invoices", async (user) => {
    const params = new URL(request.url).searchParams;
    const invoices = await listInvoices(user.id, {
      status: queryParam(params, "status", InvoiceStatus),
      clientId: params.get("clientId") || undefined,
    });
    return jsonResponse(InvoicesResponse, { invoices });
  });
}

/** POST /api/office/invoices: fatura nova (rascunho; totais calculados aqui). */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/invoices", async (user) => {
    const input = await readJson(request, CreateInvoiceRequest);
    if (!input.ok) return input.response;
    const invoice = await createInvoice(user.id, input.data);
    return jsonResponse(InvoiceResponse, { invoice }, 201);
  });
}
