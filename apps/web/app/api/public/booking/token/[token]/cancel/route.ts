import { PublicBookingResponse } from "@nosweat/schema";
import { cancelBookingByToken } from "@/server/booking/service";
import { errorResponse, jsonResponse, notFound } from "@/server/http";
import { RateLimiter, clientIp } from "@/server/notify";
import { officeHandle } from "@/server/office/api";
import { isPublicToken } from "@/server/office/tokens";

type Context = { params: Promise<{ token: string }> };

// Melhor esforço, em memória por instância: 20 cancelamentos por hora do mesmo IP.
const limiter = new RateLimiter(20, 60 * 60 * 1000);

/**
 * POST /api/public/booking/token/[token]/cancel: o cliente cancela pelo link (sem conta). Só no
 * futuro (depois do início: 409). Cancelar de novo devolve a marcação como está. O serviço da
 * agenda do dono também é cancelado e o horário reabre.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/booking/token/[token]/cancel", async () => {
    const { token } = await params;
    if (!isPublicToken(token)) return notFound("Booking");
    if (!limiter.take(clientIp(request))) {
      return errorResponse(429, "quota_exceeded", "Too many attempts. Please try again later.");
    }
    const booking = await cancelBookingByToken(token);
    if (!booking) return notFound("Booking");
    return jsonResponse(PublicBookingResponse, { booking });
  });
}
