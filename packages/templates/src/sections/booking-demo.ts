import type { AvailabilityResponse, BookableService, PublicBookingInfo } from "@nosweat/schema";
import { addDaysToKey } from "./booking-format";

// Dados de EXEMPLO do agendamento, só para as páginas /examples (modo demo): horários fixos e
// nenhuma chamada à API. Nunca entram em site publicado (lá os horários vêm do dono).

/** Serviço de exemplo, tirado da lista de preços do próprio site de exemplo. */
export type DemoService = {
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number | null;
};

const SAMPLE_TIMES = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"] as const;

export function demoBookingInfo(services: DemoService[], businessName: string): PublicBookingInfo {
  const bookable: BookableService[] = services.map((service, index) => ({
    id: `demo-${index + 1}`,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
  }));
  return {
    businessName,
    businessPhone: null,
    timeZone: "UTC",
    services: bookable,
    staff: [],
    maxDaysAhead: 14,
    note: "",
  };
}

/** Seis horários por dia; o quarto dia aparece como lotado ("Full"). */
export function demoAvailability(todayKey: string, days: number): AvailabilityResponse {
  return {
    timeZone: "UTC",
    nextAvailableAt: null,
    days: Array.from({ length: days }, (_, index) => {
      const date = addDaysToKey(todayKey, index);
      const slots =
        index === 3
          ? []
          : SAMPLE_TIMES.map((time) => ({
              startAt: `${date}T${time}:00Z`,
              endAt: `${date}T${time}:00Z`,
              staffId: null,
            }));
      return { date, slots };
    }),
  };
}
