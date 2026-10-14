import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { listClients, requireAdmin } from "@/server/admin";
import { getGrantStore, isGrantActive, PLANS } from "@/server/billing";
import { getSiteStore } from "@/server/store";

export const metadata: Metadata = { title: "Admin" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "—");

export default async function AdminOverviewPage() {
  await connection();
  await requireAdmin();
  const [clients, sites, grants] = await Promise.all([
    listClients(),
    getSiteStore().listAll(),
    getGrantStore().listAll(),
  ]);
  const grantByUser = new Map(grants.map((g) => [g.userId, g]));
  const accessLabel = (userId: string) => {
    const grant = grantByUser.get(userId) ?? null;
    if (!grant) return "—";
    const date = dateOnly.format(new Date(grant.expiresAt));
    return isGrantActive(grant) ? `${PLANS[grant.plan].name} until ${date}` : `Expired ${date}`;
  };

  const emailById = new Map(clients.map((c) => [c.id, c.email]));
  const sitesByOwner = new Map<string, typeof sites>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    sitesByOwner.set(site.ownerId, [...(sitesByOwner.get(site.ownerId) ?? []), site]);
  }

  const stats = [
    { label: "Clients", value: clients.length },
    { label: "Websites", value: sites.filter((s) => s.ownerId).length },
    { label: "Live", value: sites.filter((s) => s.status === "published").length },
    { label: "Custom domains", value: sites.filter((s) => s.customDomain).length },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Command center</h1>
        <p className="mt-1 text-slate-600">Every client and every website on No Sweat.</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-4 font-display text-lg font-bold">
          Clients
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Signed up</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 font-medium">Websites</th>
                <th className="px-5 py-3 font-medium">Live</th>
                <th className="px-5 py-3 font-medium">Manual access</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const own = sitesByOwner.get(client.id) ?? [];
                return (
                  <tr key={client.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">{client.email ?? client.id}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(client.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(client.lastSignInAt)}</td>
                    <td className="px-5 py-3">{own.length}</td>
                    <td className="px-5 py-3">
                      {own.filter((s) => s.status === "published").length}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {accessLabel(client.id)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-semibold whitespace-nowrap text-sky-700 hover:underline"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-4 font-display text-lg font-bold">
          All websites
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <Link
                      href={`/sites/${site.id}`}
                      className="font-semibold text-sky-700 hover:underline"
                    >
                      {site.spec.business.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {site.ownerId ? (emailById.get(site.ownerId) ?? site.ownerId) : "— (no owner)"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{site.spec.template}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        site.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {site.status === "published" ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {site.customDomain ?? (site.slug ? `/s/${site.slug}` : "—")}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(site.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
