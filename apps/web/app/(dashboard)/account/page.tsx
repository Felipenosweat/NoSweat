import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { focusRing, PageHeader, panelClass, panelText, panelTitle } from "@/components/DashboardUi";
import { Notice } from "@/components/glass";
import { getAccount } from "@/server/admin";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { getViewer, type ViewingAs } from "@/server/auth/viewer";
import { PasswordForm, ProfileForm } from "./AccountForms";

// Configurações da conta: nome, senha, e-mail de login (só leitura) e o pedido para apagar a
// conta (por e-mail, como dizem os Termos e a Privacidade). O layout do grupo (dashboard) já
// coloca a moldura do painel em volta. No modo "ver como" do admin, tudo fica só para leitura.

export const metadata: Metadata = { title: "Account", robots: { index: false } };

type Names = { firstName: string; lastName: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 60) : "";
}

/** Nome do cadastro (`user_metadata`) da conta mostrada. Falha = campos vazios. */
async function loadNames(viewingAs: ViewingAs | null): Promise<Names> {
  try {
    if (viewingAs) {
      const account = await getAccount(viewingAs.id);
      return { firstName: account?.firstName ?? "", lastName: account?.lastName ?? "" };
    }
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { firstName: "", lastName: "" };
    const { data } = await supabase.auth.getUser();
    const metadata = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    return { firstName: text(metadata.first_name), lastName: text(metadata.last_name) };
  } catch {
    return { firstName: "", lastName: "" };
  }
}

const textLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

export default async function AccountPage() {
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/account")}`);

  // Com login desligado (dev local sem Supabase) não há nome nem senha para mudar.
  const authEnabled = getSupabaseAuthConfig() !== null;
  const readOnly = Boolean(viewer.viewingAs) || !authEnabled;
  const email = (viewer.viewingAs ?? viewer.user).email;
  const names = await loadNames(viewer.viewingAs);

  const deleteHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Delete my account",
  )}&body=${encodeURIComponent(
    `Hi, please delete my No Sweat account and its information.\n\nAccount email: ${email ?? ""}`,
  )}`;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Account" description="Your name, password and login email." />

      {viewer.viewingAs && (
        <Notice tone="warning" className="mt-6">
          You’re viewing another account. Account settings are read-only.
        </Notice>
      )}
      {!authEnabled && (
        <Notice tone="info" className="mt-6">
          Login is turned off on this server, so there is nothing to change here.
        </Notice>
      )}

      <div className="mt-8 grid gap-5">
        <section aria-labelledby="account-email" className={panelClass}>
          <h2 id="account-email" className={panelTitle}>
            Login email
          </h2>
          <p className="mt-2 text-[15px] font-semibold [overflow-wrap:anywhere] text-ink">
            {email ?? "No email on this account"}
          </p>
          <p className={`mt-2 ${panelText}`}>
            Need to log in with a different email? Write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={textLink}>
              {CONTACT_EMAIL}
            </a>{" "}
            from this address.
          </p>
        </section>

        <section aria-labelledby="account-name" className={panelClass}>
          <h2 id="account-name" className={panelTitle}>
            Your name
          </h2>
          <p className={`mt-1 ${panelText}`}>We use it to greet you in your dashboard.</p>
          <ProfileForm firstName={names.firstName} lastName={names.lastName} readOnly={readOnly} />
        </section>

        <section aria-labelledby="account-password" className={panelClass}>
          <h2 id="account-password" className={panelTitle}>
            Password
          </h2>
          <p className={`mt-1 ${panelText}`}>
            Choose a new password. You’ll stay logged in here; other devices are logged out.
          </p>
          <PasswordForm readOnly={readOnly} />
        </section>

        <section aria-labelledby="account-delete" className={panelClass}>
          <h2 id="account-delete" className={panelTitle}>
            Delete account
          </h2>
          <p className={`mt-1 ${panelText}`}>
            To delete your account and its information, email us from the address on your account.
            You can delete a single website anytime from its page.
          </p>
          {readOnly ? (
            <p className="mt-4 text-sm text-(--glass-fg-muted)">
              {viewer.viewingAs
                ? "Not available while viewing another account."
                : "Not available on this server."}
            </p>
          ) : (
            <p className="mt-4">
              <a href={deleteHref} className={textLink}>
                Email a deletion request
              </a>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
