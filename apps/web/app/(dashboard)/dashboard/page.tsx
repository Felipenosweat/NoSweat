import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SitesGrid } from "@/components/SitesGrid";
import { getCurrentUser } from "@/server/auth/session";
import { getSiteStore } from "@/server/store";

export const metadata: Metadata = { title: "My sites" };

export default async function DashboardPage() {
  // Sempre renderiza na hora do request (os dados mudam a cada site gerado).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const sites = await getSiteStore().list(user.id);

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-ink lg:text-[2.5rem]">
        My sites
      </h1>
      {sites.length > 0 && (
        <p className="mt-1 text-slate-500 tabular-nums">
          {sites.length} site{sites.length === 1 ? "" : "s"}
        </p>
      )}

      <SitesGrid sites={sites} />
    </div>
  );
}
