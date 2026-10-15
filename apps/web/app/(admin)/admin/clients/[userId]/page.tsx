import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SitesGrid } from "@/components/SitesGrid";
import { listClients, requireAdmin } from "@/server/admin";
import { billingEnforced, getGrantStore } from "@/server/billing";
import { getBillingStore } from "@/server/billing/store";
import { getSocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";
import type { SocialPostStatus } from "@nosweat/schema";
import { AccessPanel } from "./AccessPanel";
import { SocialPanel } from "./SocialPanel";

export const metadata: Metadata = { title: "Client" };

type ClientPageProps = { params: Promise<{ userId: string }> };

/** "Ver como o cliente": o mesmo painel que o cliente vê em /dashboard. */
export default async function AdminClientPage({ params }: ClientPageProps) {
  await connection();
  const admin = await requireAdmin();
  const { userId } = await params;
  const client = (await listClients()).find((c) => c.id === userId);
  if (!client) notFound();
  const social = getSocialStore();
  const [sites, grant, subscription, socialAccount, socialSettings, socialPosts] =
    await Promise.all([
      getSiteStore().list(client.id),
      getGrantStore().get(client.id),
      getBillingStore().get(client.id),
      social.getAccountForOwner(client.id, "instagram"),
      social.getSettings(client.id),
      // Todos os posts (intervalo largo + rascunhos sem data), só para contar por status.
      social.listPosts(client.id, "2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z"),
    ]);
  const postCounts: Partial<Record<SocialPostStatus, number>> = {};
  for (const post of socialPosts) postCounts[post.status] = (postCounts[post.status] ?? 0) + 1;
  // Registro de que um admin abriu os dados sociais do cliente (sem detalhes sensíveis).
  await social.logEvent({ ownerId: client.id, actorId: admin.id, action: "admin_view" });

  return (
    <div>
      <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        &larr; All clients
      </Link>
      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900">
        You&rsquo;re viewing <strong>{client.email ?? client.id}</strong>&rsquo;s dashboard as an
        admin. Changes you make here affect their websites.
      </div>

      <AccessPanel
        userId={client.id}
        grant={grant}
        subscription={subscription}
        enforced={billingEnforced()}
      />

      <SocialPanel
        userId={client.id}
        account={socialAccount}
        settings={socialSettings}
        counts={postCounts}
      />

      <div className="mt-6 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My sites</h1>
        <p className="mt-1 text-slate-600">
          {sites.length === 0
            ? "No sites yet."
            : `${sites.length} site${sites.length === 1 ? "" : "s"}`}
        </p>
        <SitesGrid
          sites={sites}
          emptyState={<p className="mt-6 text-slate-600">This client has no sites.</p>}
        />
      </div>
    </div>
  );
}
