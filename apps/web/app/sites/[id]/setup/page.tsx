import type { PriceItem } from "@nosweat/schema";
import { DEFAULT_BOOKING_SETTINGS } from "@nosweat/schema";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { AccountShellForCurrentViewer } from "@/app/(dashboard)/AccountShell";
import { BackLink, PageHeader } from "@/components/DashboardUi";
import { initialState, setupKindFor, type WizardState } from "@/lib/setup/wizard";
import { getCurrentUser } from "@/server/auth/session";
import { getBookingStore } from "@/server/booking/store";
import { getOfficeSettings, listPriceItems } from "@/server/office/service";
import { getOwnedSite } from "@/server/sites";
import type { SiteRecord } from "@/server/store";
import { SetupWizard } from "./SetupWizard";

export const metadata: Metadata = { title: "Set up online booking", robots: { index: false } };

type SetupPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

/** Tudo que o assistente precisa (fora do componente: usa o relógio e lê o banco). */
async function loadSetup(
  site: SiteRecord,
  ownerId: string,
  kind: NonNullable<ReturnType<typeof setupKindFor>>,
): Promise<{ initial: WizardState; today: string; year: number }> {
  const [saved, items, office] = await Promise.all([
    getBookingStore()
      .getSettings(ownerId)
      .catch((error: unknown) => {
        console.error("[setup] could not read the booking settings", error);
        return null;
      }),
    listPriceItems(ownerId).catch((error: unknown): PriceItem[] => {
      console.error("[setup] could not read the price book", error);
      return [];
    }),
    getOfficeSettings(ownerId).catch((error: unknown) => {
      console.error("[setup] could not read the office settings", error);
      return null;
    }),
  ]);
  const now = new Date();
  return {
    initial: initialState({
      kind,
      spec: site.spec,
      settings: saved ?? DEFAULT_BOOKING_SETTINGS,
      settingsSaved: saved !== null,
      priceItems: items,
      timeZone: office?.timeZone,
    }),
    // O dia de hoje no fuso da empresa (os feriados só mostram o que ainda vem).
    today: dayInZone(now, office?.timeZone),
    year: Number(dayInZone(now, office?.timeZone).slice(0, 4)),
  };
}

function dayInZone(at: Date, timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone ?? "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

export default async function SetupPage({ params, searchParams }: SetupPageProps) {
  await connection();
  const { id } = await params;
  const { from } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/${encodeURIComponent(id)}/setup`);
  const site = await getOwnedSite(user, id);
  // Só o dono configura a agenda (um admin vendo o site de outra conta não grava nada).
  if (!site || site.ownerId !== user.id) notFound();

  const kind = setupKindFor(site.spec.template);
  // Os outros ramos (restaurante, portfólio...) não têm assistente.
  if (!kind) redirect(`/sites/${site.id}`);

  const { initial, today, year } = await loadSetup(site, user.id, kind);
  const name = site.spec.business.name.trim() || "your site";
  const fromCreate = (Array.isArray(from) ? from[0] : from) === "create";

  return (
    <AccountShellForCurrentViewer>
      <PageHeader
        back={<BackLink href={`/sites/${site.id}`}>Manage site</BackLink>}
        title="Set up online booking"
        description={
          kind === "home"
            ? `A few questions so customers can book an arrival window with ${name}.`
            : `A few questions so customers can book a time with ${name}.`
        }
      />
      <div className="mt-8">
        <SetupWizard
          siteId={site.id}
          siteName={name}
          initial={initial}
          today={today}
          year={year}
          fromCreate={fromCreate}
        />
      </div>
    </AccountShellForCurrentViewer>
  );
}
