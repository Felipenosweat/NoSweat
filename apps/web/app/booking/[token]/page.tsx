import type { Metadata } from "next";
import { connection } from "next/server";
import { ManageBooking } from "./ManageBooking";

// Página pública do cliente do dono: ver o agendamento e cancelar pelo link (sem conta). O link
// é privado: nunca indexado e sem Referer. Os dados vêm de /api/public/booking/token/<token>.

type BookingPageProps = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Your booking",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  // O token não vaza para outros sites pelo Referer.
  referrer: "no-referrer",
};

export default async function BookingPage({ params }: BookingPageProps) {
  // Sempre na hora do request (o horário pode ter acabado de ser cancelado).
  await connection();
  const { token } = await params;
  return (
    <div className="min-h-dvh bg-slate-100/80">
      <main
        id="main"
        className="mx-auto grid w-full max-w-xl gap-4 px-3 pt-6 pb-16 sm:px-6 sm:pt-12"
      >
        <ManageBooking token={token} />
        <p className="text-center text-xs text-slate-500">
          Booking by{" "}
          <a href="https://www.nosweatfd.com" className="underline-offset-4 hover:underline">
            No Sweat
          </a>
        </p>
      </main>
    </div>
  );
}
