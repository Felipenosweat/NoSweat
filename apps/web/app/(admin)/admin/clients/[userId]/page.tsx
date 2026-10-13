import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SitesGrid } from "@/components/SitesGrid";
import { listClients } from "@/server/admin";
import { getSiteStore } from "@/server/store";

export const metadata: Metadata = { title: "Client" };

type ClientPageProps = { params: Promise<{ userId: string }> };

/** "Ver como o cliente": o mesmo painel que o cliente vê em /dashboard. */
export default async function AdminClientPage({ params }: ClientPageProps) {
  await connection();
  const { userId } = await params;
  const client = (await listClients()).find((c) => c.id === userId);
  if (!client) notFound();
  const sites = await getSiteStore().list(client.id);

  return (
    <div>
      <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        &larr; All clients
      </Link>
      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900">
        You&rsquo;re viewing <strong>{client.email ?? client.id}</strong>&rsquo;s dashboard as an
        admin. Changes you make here affect their websites.
      </div>

      <div className="mt-6 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My sites</h1>
        <p className="mt-1 text-slate-600">
          {sites.length === 0
            ? "No sites yet."
            : `${sites.length} site${sites.length === 1 ? "" : "s"}`}
        </p>
        <SitesGrid sites={sites} />
      </div>
    </div>
  );
}
