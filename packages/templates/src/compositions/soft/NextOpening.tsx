"use client";

import type { AvailabilityResponse, PublicBookingInfo } from "@nosweat/schema";
import { useEffect, useState } from "react";
import { demoAvailability, demoBookingInfo } from "../../sections/booking-demo";
import {
  addDaysToKey,
  dateKeyInZone,
  formatNextOpening,
  formatTime,
  isAvailabilityResponse,
  isPublicBookingInfo,
  slotsByDate,
} from "../../sections/booking-format";
import type { BookingDemo } from "../../sections/BookingSection";
import { BookLink } from "./BookLink";

type Opening = { label: string; times: string[] };

/**
 * Mini cartão "Next opening" do topo (computador): o primeiro horário livre do primeiro serviço,
 * lido da mesma API do agendamento. Sem dados (ou sem horário), não aparece. Fica por cima da
 * foto (posição absoluta), então não desloca nada.
 */
export function NextOpening({ endpoint, demo }: { endpoint?: string; demo?: BookingDemo }) {
  const [opening, setOpening] = useState<Opening | null>(null);

  useEffect(() => {
    // Só no computador: no celular o cartão fica escondido e nem busca.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    let live = true;
    const days = 7;

    const finish = (info: PublicBookingInfo, todayKey: string, data: AvailabilityResponse) => {
      const byDate = slotsByDate(data);
      for (let i = 0; i < days; i++) {
        const slots = byDate.get(addDaysToKey(todayKey, i)) ?? [];
        const first = slots[0];
        if (!first) continue;
        const times = [...new Set(slots.map((slot) => slot.startAt))]
          .slice(0, 3)
          .map((startAt) => formatTime(startAt, info.timeZone));
        setOpening({ label: formatNextOpening(first.startAt, info.timeZone, todayKey), times });
        return;
      }
    };

    if (demo) {
      const info = demoBookingInfo(demo.services, demo.businessName);
      const todayKey = dateKeyInZone(new Date(), "UTC");
      finish(info, todayKey, demoAvailability(todayKey, days));
      return;
    }
    if (!endpoint) return;
    fetch(endpoint)
      .then((res): Promise<unknown> | null => (res.ok ? res.json() : null))
      .then((info) => {
        const first = isPublicBookingInfo(info) ? info.services[0] : undefined;
        if (!isPublicBookingInfo(info) || !first) return null;
        const todayKey = dateKeyInZone(new Date(), info.timeZone);
        const query = new URLSearchParams({
          serviceId: first.id,
          from: todayKey,
          days: String(days),
        });
        return fetch(`${endpoint}/availability?${query.toString()}`)
          .then((res): Promise<unknown> | null => (res.ok ? res.json() : null))
          .then((data) => {
            if (live && isAvailabilityResponse(data)) finish(info, todayKey, data);
          });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [endpoint, demo]);

  if (!opening) return null;
  return (
    <div className="ns-s-card ns-s-mini">
      <small>Next opening</small>
      <b>{opening.label}</b>
      <div className="ns-s-times">
        {opening.times.map((time, index) => (
          <BookLink key={time} className={`ns-s-time${index === 0 ? " is-on" : ""}`}>
            {time}
          </BookLink>
        ))}
      </div>
    </div>
  );
}
