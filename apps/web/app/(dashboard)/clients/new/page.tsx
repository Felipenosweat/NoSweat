import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { panelClass, panelText, textButton } from "@/components/DashboardUi";
import { getCurrentUser } from "@/server/auth/session";
import { pageTitle } from "../ui";
import { NewClientForm } from "./NewClientForm";

export const metadata: Metadata = { title: "Add client", robots: { index: false } };

export default async function NewClientPage() {
  // Sempre na hora do request (sessão do dono).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/clients/new");

  return (
    <div className="max-w-2xl">
      <Link href="/clients" className={`${textButton} -ml-1`}>
        <span aria-hidden="true">‹</span> Clients
      </Link>
      <h1 className={`mt-2 ${pageTitle}`}>Add client</h1>
      <p className={`mt-2 max-w-[60ch] ${panelText}`}>
        For people you already work with. Messages from your website&rsquo;s contact form are added
        on their own.
      </p>
      <div className={`mt-8 ${panelClass}`}>
        <NewClientForm />
      </div>
    </div>
  );
}
