import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader, panelClass, textButton } from "@/components/DashboardUi";
import { getCurrentUser } from "@/server/auth/session";
import { NewClientForm } from "./NewClientForm";

export const metadata: Metadata = { title: "Add client", robots: { index: false } };

export default async function NewClientPage() {
  // Sempre na hora do request (sessão do dono).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/clients/new");

  return (
    <div className="max-w-2xl">
      <PageHeader
        back={
          <Link href="/clients" className={`${textButton} -ml-1`}>
            <span aria-hidden="true">‹</span> Clients
          </Link>
        }
        title="Add client"
        description={
          <>
            For people you already work with. Messages from your website&rsquo;s contact form are
            added on their own.
          </>
        }
      />
      <div className={`mt-8 ${panelClass}`}>
        <NewClientForm />
      </div>
    </div>
  );
}
