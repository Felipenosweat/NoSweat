import { AvailabilityQuery, AvailabilityResponse } from "@nosweat/schema";
import { errorResponse, jsonResponse, notFound } from "@/server/http";
import { getPublicAvailability } from "@/server/booking/service";
import { officeHandle } from "@/server/office/api";

type Context = { params: Promise<{ siteId: string }> };

/**
 * GET /api/public/booking/[siteId]/availability?serviceId=&from=AAAA-MM-DD&days=7&staffId=:
 * horários livres de cada dia (na hora da empresa) e a próxima vaga. Público, sem conta.
 */
export async function GET(request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/booking/[siteId]/availability", async () => {
    const { siteId } = await params;
    const query = AvailabilityQuery.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      const message = [...new Set(query.error.issues.map((issue) => issue.message))].join(" ");
      return errorResponse(400, "invalid_request", message);
    }
    const availability = await getPublicAvailability(siteId, query.data);
    if (!availability) return notFound("Booking page");
    return jsonResponse(AvailabilityResponse, availability);
  });
}
