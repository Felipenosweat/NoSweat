import { PublicBookingInfo } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { getPublicBookingInfo } from "@/server/booking/service";
import { officeHandle } from "@/server/office/api";

type Context = { params: Promise<{ siteId: string }> };

/**
 * GET /api/public/booking/[siteId]: serviços, equipe e regras que o seletor do site mostra. Público,
 * sem conta. 404 se o site não está no ar, o plano do dono não vale, o agendamento está desligado
 * ou não há serviço agendável.
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/booking/[siteId]", async () => {
    const { siteId } = await params;
    const info = await getPublicBookingInfo(siteId);
    if (!info) return notFound("Booking page");
    return jsonResponse(PublicBookingInfo, info);
  });
}
