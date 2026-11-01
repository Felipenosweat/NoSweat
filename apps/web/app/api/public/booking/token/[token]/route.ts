import { PublicBookingResponse } from "@nosweat/schema";
import { getBookingByToken } from "@/server/booking/service";
import { jsonResponse, notFound } from "@/server/http";
import { officeHandle } from "@/server/office/api";
import { isPublicToken } from "@/server/office/tokens";

type Context = { params: Promise<{ token: string }> };

/** GET /api/public/booking/token/[token]: a marcação do cliente pelo link (sem conta). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/booking/token/[token]", async () => {
    const { token } = await params;
    if (!isPublicToken(token)) return notFound("Booking");
    const booking = await getBookingByToken(token);
    if (!booking) return notFound("Booking");
    return jsonResponse(PublicBookingResponse, { booking });
  });
}
