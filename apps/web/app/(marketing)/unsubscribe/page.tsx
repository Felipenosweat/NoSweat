import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import {
  bodyClass,
  container,
  primaryButton,
  secondaryButton,
  textLink,
} from "@/components/marketing/styles";
import { isValidUnsubscribeToken } from "@/server/marketing";
import { confirmUnsubscribe } from "./actions";

// Página do link "Unsubscribe" dos e-mails de marketing. Pede um clique de confirmação (GET não
// descadastra, porque filtros de spam abrem os links). E-mails da conta (confirmação, senha,
// pedidos do formulário) continuam chegando: só o marketing para.

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ email?: string; token?: string; status?: string }>;

const cardClass = "mx-auto max-w-[34rem] rounded-xl border border-slate-200 bg-white p-6 sm:p-10";
const titleClass =
  "font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink";

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const { email = "", token = "", status } = await searchParams;
  const valid = Boolean(
    email && token && email.length <= 254 && isValidUnsubscribeToken(email, token),
  );

  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className={container}>
        <div className={cardClass}>
          {!valid ? (
            <>
              <h1 className={titleClass}>This link isn’t valid.</h1>
              <p className={`mt-4 ${bodyClass}`}>
                Please use the Unsubscribe link from the latest email we sent you, or email{" "}
                <a href={`mailto:${CONTACT_EMAIL}?subject=Unsubscribe`} className={textLink}>
                  {CONTACT_EMAIL}
                </a>{" "}
                and we’ll remove you by hand.
              </p>
            </>
          ) : status === "done" ? (
            <>
              <h1 className={titleClass}>You’re unsubscribed.</h1>
              <p className={`mt-4 ${bodyClass}`}>
                <strong className="font-semibold text-ink">{email}</strong> won’t get launch or
                product news from No Sweat anymore. We’ll still send emails about your account, like
                sign-in links and messages from your website’s contact form.
              </p>
              <Link href="/" className={`mt-8 ${secondaryButton}`}>
                Back to No Sweat
              </Link>
            </>
          ) : (
            <>
              <h1 className={titleClass}>Unsubscribe from No Sweat news?</h1>
              <p className={`mt-4 ${bodyClass}`}>
                We’ll stop sending launch and product emails to{" "}
                <strong className="font-semibold text-ink">{email}</strong>. Emails about your
                account keep coming.
              </p>
              {status === "error" && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  Something went wrong. Please try again.
                </p>
              )}
              <form action={confirmUnsubscribe} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="token" value={token} />
                <button type="submit" className={primaryButton}>
                  Unsubscribe
                </button>
                <Link href="/" className={secondaryButton}>
                  Keep me on the list
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
