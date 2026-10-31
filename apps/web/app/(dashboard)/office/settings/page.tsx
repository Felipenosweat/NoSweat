import type { OfficeSettings } from "@nosweat/schema";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { Notice } from "@/components/glass";
import { getViewer } from "@/server/auth/viewer";
import { getOfficeSettings } from "@/server/office/service";
import { OfficeTabs } from "../_ui/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Business settings", robots: { index: false } };

export default async function OfficeSettingsPage() {
  // Sempre na hora do request (dados do dono).
  await connection();
  // "Ver como" do admin: só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/office/settings");
  const readOnly = viewer.viewingAs !== null;

  let settings: OfficeSettings | null = null;
  try {
    settings = await getOfficeSettings(viewer.ownerId);
  } catch (error) {
    console.error("[office] could not read settings", error);
  }

  return (
    // Mesma largura das outras abas do escritório (Price book, Team). O Team fica nas abas.
    <div className="max-w-3xl">
      <PageHeader
        title="Business settings"
        description="How your estimates and invoices look, and the defaults for new ones."
      />
      <div className="mt-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <OfficeTabs current="settings" />
      </div>
      <div className="mt-8">
        {settings ? (
          <SettingsForm settings={settings} readOnly={readOnly} />
        ) : (
          <Notice tone="error">
            We couldn&rsquo;t load your settings. Please refresh the page.
          </Notice>
        )}
      </div>
    </div>
  );
}
