"use client";

import { PublicBookingResponse, type PublicBooking } from "@nosweat/schema";
import { useEffect, useState } from "react";
import { ConfirmDialog, GlassButton, Notice } from "@/components/glass";
import { phoneHref } from "@/lib/office";

// Cartão do agendamento para o cliente do dono: detalhes e "Cancel this booking" (com
// confirmação). Horários sempre no fuso da empresa (`booking.timeZone`), nunca o do visitante.

type Load =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; booking: PublicBooking };

/** "Tue, Dec 3 at 2:30 PM EST": sempre no fuso da empresa, nunca o do visitante. */
function formatBookingDateTime(iso: string, timeZone: string): string {
  const instant = new Date(iso);
  const zone = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
      return timeZone;
    } catch {
      return "UTC";
    }
  })();
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: zone,
  }).format(instant);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
    timeZone: zone,
  })
    .format(instant)
    .replace(/[\u202f\u00a0]/g, " ");
  return `${date} at ${time}`;
}

/** Mensagem de erro da API (`{ error: { message } }`), se vier. */
function apiMessage(json: unknown): string | null {
  if (typeof json !== "object" || json === null || !("error" in json)) return null;
  const error = (json as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : null;
}

export function ManageBooking({ token }: { token: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/public/booking/token/${encodeURIComponent(token)}`;

  useEffect(() => {
    let live = true;
    fetch(base)
      .then((res): Promise<unknown> | null => (res.ok ? res.json() : null))
      .then((json) => {
        if (!live) return;
        const parsed = PublicBookingResponse.safeParse(json);
        setLoad(
          parsed.success
            ? { status: "ready", booking: parsed.data.booking }
            : { status: "missing" },
        );
      })
      .catch(() => {
        if (live) setLoad({ status: "missing" });
      });
    return () => {
      live = false;
    };
  }, [base]);

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`${base}/cancel`, { method: "POST" });
      const json: unknown = await res.json().catch(() => null);
      const parsed = PublicBookingResponse.safeParse(json);
      if (res.ok && parsed.success) {
        setLoad({ status: "ready", booking: parsed.data.booking });
        setConfirming(false);
      } else {
        setError(apiMessage(json) ?? "We couldn't cancel this booking. Please call the business.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (load.status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading your booking"
        className="h-72 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 motion-safe:animate-pulse"
      />
    );
  }
  if (load.status === "missing") {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Booking not found</h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">
          This link doesn&rsquo;t match a booking. Check the link you were given, or contact the
          business directly.
        </p>
      </section>
    );
  }

  const { booking } = load;
  const canceled = booking.status === "canceled";
  return (
    <section
      aria-labelledby="booking-title"
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
    >
      <p className="text-sm font-semibold text-slate-600">{booking.businessName}</p>
      <h1 id="booking-title" className="mt-1 font-display text-2xl font-semibold text-ink">
        {canceled ? "Booking canceled" : "Your booking"}
      </h1>
      {canceled && (
        <Notice tone="info" size="sm" className="mt-4">
          This booking was canceled. To book another time, visit the business&rsquo;s website.
        </Notice>
      )}
      <dl className="mt-6 grid gap-4 text-[15px]">
        <div>
          <dt className="text-sm text-slate-600">Service</dt>
          <dd className={`font-semibold text-ink ${canceled ? "line-through" : ""}`}>
            {booking.serviceName}
            {booking.staffName ? ` with ${booking.staffName}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">When</dt>
          <dd className={`font-semibold text-ink tabular-nums ${canceled ? "line-through" : ""}`}>
            {formatBookingDateTime(booking.startAt, booking.timeZone)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Name</dt>
          <dd className="text-ink">{booking.customerName}</dd>
        </div>
        {booking.businessAddress && (
          <div>
            <dt className="text-sm text-slate-600">Where</dt>
            <dd className="text-ink">{booking.businessAddress}</dd>
          </div>
        )}
        {booking.businessPhone && (
          <div>
            <dt className="text-sm text-slate-600">Phone</dt>
            <dd>
              <a
                href={`tel:${phoneHref(booking.businessPhone)}`}
                className="inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline"
              >
                {booking.businessPhone}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {!canceled && booking.canCancel && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <GlassButton variant="secondary" onClick={() => setConfirming(true)}>
            Cancel this booking
          </GlassButton>
          {booking.businessPhone && (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              To change the time, cancel and book again, or call the business.
            </p>
          )}
        </div>
      )}
      {!canceled && !booking.canCancel && (
        <p className="mt-6 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">
          This booking can no longer be canceled online.
          {booking.businessPhone ? " Please call the business." : ""}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel it"
        pendingLabel="Canceling…"
        cancelLabel="Keep it"
        pending={pending}
        error={error}
        onConfirm={() => void cancel()}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      >
        {booking.serviceName} on {formatBookingDateTime(booking.startAt, booking.timeZone)} will be
        canceled and the time opens up for someone else.
      </ConfirmDialog>
    </section>
  );
}
