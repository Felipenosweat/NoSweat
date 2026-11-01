import { CreateBookingRequest, PublicBookingResponse } from "@nosweat/schema";
import { createBooking } from "@/server/booking/service";
import { errorResponse, jsonResponse, notFound, readJson } from "@/server/http";
import { RateLimiter, appOrigin, clientIp, notifyOfBooking } from "@/server/notify";
import { officeHandle } from "@/server/office/api";

type Context = { params: Promise<{ siteId: string }> };

// Anti-abuso (melhor esforço, em memória por instância, como em server/notify/rate-limit.ts):
// 6 marcações por hora do mesmo IP e 3 por hora do mesmo telefone. A regra de verdade é a do
// banco: um horário só aceita UMA marcação (a segunda recebe 409 `slot_taken`).
const HOUR_MS = 60 * 60 * 1000;
const perIp = new RateLimiter(6, HOUR_MS);
const perPhone = new RateLimiter(3, HOUR_MS);

/**
 * POST /api/public/booking/[siteId]/book: o cliente do site marca um horário. Público, sem conta.
 * Campo-isca `website` preenchido → 400. Horário ocupado ou fora das regras → 409 `slot_taken`;
 * site sem agendamento → 404. 201 com a marcação (e o `token` do link de ver/cancelar). Avisa o
 * dono (e o cliente, se deu e-mail) por e-mail depois da resposta.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/booking/[siteId]/book", async () => {
    const { siteId } = await params;
    const input = await readJson(request, CreateBookingRequest);
    if (!input.ok) return input.response;

    const phoneKey = input.data.phone.replace(/\D/g, "") || input.data.phone;
    // Os dois limites contam juntos: `&&` não pararia no primeiro, e assim o telefone e o IP
    // gastam a tentativa mesmo quando só um deles estoura.
    const ipOk = perIp.take(clientIp(request));
    const phoneOk = perPhone.take(phoneKey);
    if (!ipOk || !phoneOk) {
      return errorResponse(
        429,
        "quota_exceeded",
        "Too many booking attempts. Please try again later or call us instead.",
      );
    }

    const created = await createBooking(siteId, input.data);
    if (!created) return notFound("Booking page");
    notifyOfBooking({ ...created.notice, appOrigin: appOrigin(request.url) });
    return jsonResponse(PublicBookingResponse, { booking: created.booking }, 201);
  });
}
