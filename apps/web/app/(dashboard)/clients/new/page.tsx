import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { GlassButton, GlassCard } from "@/components/glass";
import { getViewer } from "@/server/auth/viewer";
import { NewClientForm } from "./NewClientForm";

export const metadata: Metadata = { title: "Add client", robots: { index: false } };

// Página própria do cadastro (link direto, nova aba, ou sem JavaScript). Na lista, "Add client"
// abre o mesmo formulário numa folha, sem sair da tela.

export default async function NewClientPage() {
  // Sempre na hora do request (sessão do dono).
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/clients/new");
  // Modo "ver como" do admin: só leitura (o proxy recusaria o cadastro com 403).
  if (viewer.viewingAs) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        back={
          <GlassButton href="/clients" variant="ghost" size="sm" className="-ml-2">
            <span aria-hidden="true">‹</span> Clients
          </GlassButton>
        }
        title="Add client"
        description={
          <>
            For people you already work with. Messages from your website&rsquo;s contact form are
            added on their own.
          </>
        }
      />
      <GlassCard className="mt-8">
        <NewClientForm />
      </GlassCard>
    </div>
  );
}
