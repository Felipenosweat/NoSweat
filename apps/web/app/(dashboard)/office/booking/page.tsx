import type { PriceItem } from "@nosweat/schema";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { getViewer } from "@/server/auth/viewer";
import { listPriceItems } from "@/server/office/service";
import { getSiteStore, type SiteRecord } from "@/server/store";
import { OfficeTabs } from "../_ui/ui";
import { BookingForm, type BookingSite } from "./BookingForm";

export const metadata: Metadata = { title: "Online booking", robots: { index: false } };

function toBookingSite(site: SiteRecord): BookingSite {
  return {
    id: site.id,
    name: site.spec.business.name.trim() || "Untitled website",
    slug: site.status === "published" ? site.slug : null,
    hasSection: site.spec.sections.some((section) => section.type === "booking"),
  };
}

/** Itens da tabela de preços que o cliente vê: agendáveis, ativos e com duração. */
function countBookable(items: PriceItem[] | null): number | null {
  if (!items) return null;
  return items.filter((item) => item.active && item.bookable && item.durationMinutes).length;
}

export default async function OfficeBookingPage() {
  // Sempre na hora do request (dados do dono).
  await connection();
  // "Ver como" do admin: só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/office/booking");
  const readOnly = viewer.viewingAs !== null;

  let sites: BookingSite[] = [];
  try {
    sites = (await getSiteStore().list(viewer.ownerId)).map(toBookingSite);
  } catch (error) {
    console.error("[booking] could not list sites", error);
  }
  let items: PriceItem[] | null = null;
  try {
    items = await listPriceItems(viewer.ownerId);
  } catch (error) {
    console.error("[booking] could not list price items", error);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Online booking"
        description="Put your open hours on your site. Customers pick a time and your site shows what is still free."
      />
      <div className="mt-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <OfficeTabs current="booking" />
      </div>
      <div className="mt-8">
        <BookingForm sites={sites} bookableCount={countBookable(items)} readOnly={readOnly} />
      </div>
    </div>
  );
}
