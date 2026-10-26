import type { PriceItem } from "@nosweat/schema";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { getViewer } from "@/server/auth/viewer";
import { listPriceItems } from "@/server/office/service";
import { OfficeTabs } from "../_ui/ui";
import { PriceBook } from "./PriceBook";

export const metadata: Metadata = { title: "Price book", robots: { index: false } };

export default async function PriceBookPage() {
  // Sempre na hora do request (dados do dono).
  await connection();
  // "Ver como" do admin: só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/office/price-book");
  const readOnly = viewer.viewingAs !== null;

  // Todos os itens, ativos e inativos (a tela separa).
  let items: PriceItem[] | null = null;
  try {
    items = await listPriceItems(viewer.ownerId);
  } catch (error) {
    console.error("[office] could not list price items", error);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Price book"
        description="Your usual services and parts, ready to drop into any estimate or invoice."
      />
      <div className="mt-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <OfficeTabs current="price-book" />
      </div>
      <div className="mt-8">
        {items ? (
          <PriceBook items={items} readOnly={readOnly} />
        ) : (
          <p
            role="alert"
            className="glass-edge rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
          >
            We couldn&rsquo;t load your price book. Please refresh the page.
          </p>
        )}
      </div>
    </div>
  );
}
