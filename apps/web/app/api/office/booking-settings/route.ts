import { BookingSettingsResponse, UpdateBookingSettingsRequest } from "@nosweat/schema";
import { getBookingSettings, updateBookingSettings } from "@/server/booking/service";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";

/** GET /api/office/booking-settings: regras de agendamento do dono (padrões: desligado). */
export async function GET(): Promise<Response> {
  return ownerRoute("/api/office/booking-settings", async (user) => {
    const settings = await getBookingSettings(user.id);
    return jsonResponse(BookingSettingsResponse, { settings });
  });
}

/** PUT /api/office/booking-settings: muda só os campos enviados. */
export async function PUT(request: Request): Promise<Response> {
  return ownerRoute("/api/office/booking-settings", async (user) => {
    const input = await readJson(request, UpdateBookingSettingsRequest);
    if (!input.ok) return input.response;
    const settings = await updateBookingSettings(user.id, input.data);
    return jsonResponse(BookingSettingsResponse, { settings });
  });
}
