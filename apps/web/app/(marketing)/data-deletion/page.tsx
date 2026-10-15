import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { bodyClass, container, primaryButton, textLink } from "@/components/marketing/styles";
import { getSocialStore } from "@/server/social/store";

// Página pública de exclusão de dados do Instagram (exigida pela Meta). Explica as três formas
// de pedir a exclusão e, com ?code=..., mostra só o status do pedido (o código vem da resposta
// do callback de data deletion da Meta). Funciona sem Supabase (store em memória).

export const metadata: Metadata = {
  title: "Data deletion",
  description:
    "How to delete the data No Sweat received from Instagram, and how to check the status of a deletion request.",
  alternates: { canonical: "/data-deletion" },
};

type SearchParams = Promise<{ code?: string | string[] }>;

// Mesmo formato aceito pelo store do Supabase; o resto nem é consultado.
const CODE_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

const titleClass =
  "font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink lg:text-6xl";
const h2Class =
  "font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-balance text-ink";
const proseClass =
  "mt-4 space-y-4 text-base leading-[1.7] text-pretty text-slate-600 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-5 [&_ol]:marker:text-slate-500";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

type Lookup =
  | { kind: "none" }
  | { kind: "not_found" }
  | {
      kind: "found";
      code: string;
      status: "received" | "completed";
      createdAt: string;
      completedAt: string | null;
    };

async function lookup(raw: string | string[] | undefined): Promise<Lookup> {
  const code = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!code) return { kind: "none" };
  if (!CODE_PATTERN.test(code)) return { kind: "not_found" };
  const request = await getSocialStore().getDeletionRequest(code);
  if (!request) return { kind: "not_found" };
  return {
    kind: "found",
    code,
    status: request.status,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
  };
}

function StatusCard({ result }: { result: Exclude<Lookup, { kind: "none" }> }) {
  if (result.kind === "not_found") {
    return (
      <div
        role="status"
        className="mt-8 max-w-[62ch] rounded-lg border border-slate-300 bg-white px-5 py-4"
      >
        <p className="font-display text-lg font-semibold text-ink">Not found</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          We couldn’t find a deletion request with that confirmation code. Check the code and try
          again, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Data%20deletion`} className={textLink}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  const completed = result.status === "completed";
  return (
    <div
      role="status"
      className="mt-8 max-w-[62ch] rounded-lg border border-slate-300 bg-white px-5 py-4"
    >
      <p className="text-sm text-slate-500">
        Confirmation code <span className="font-mono break-all text-ink">{result.code}</span>
      </p>
      <p className="mt-2 font-display text-lg font-semibold text-ink">
        {completed ? "Completed" : "In progress"}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        {completed
          ? `We received this request on ${formatDate(result.createdAt)} and deleted the data${
              result.completedAt ? ` on ${formatDate(result.completedAt)}` : ""
            }.`
          : `We received this request on ${formatDate(result.createdAt)}. The data will be deleted within 30 days of that date.`}
      </p>
    </div>
  );
}

export default async function DataDeletionPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const { code } = await searchParams;
  const result = await lookup(code);

  return (
    <div className="bg-white">
      <header className="border-b border-slate-200 bg-surface">
        <div className={`${container} pt-12 pb-10 lg:pt-20 lg:pb-14`}>
          <h1 className={titleClass}>Data deletion</h1>
          <p className={`mt-6 max-w-[62ch] ${bodyClass}`}>
            How to delete the data No Sweat received from Instagram when you connected your account,
            and how to check the status of a deletion request.
          </p>
          {result.kind !== "none" && <StatusCard result={result} />}
        </div>
      </header>

      <div className={`${container} py-12 lg:py-20`}>
        <article className="max-w-[70ch]">
          <section aria-labelledby="what-we-delete" className="pb-10">
            <h2 id="what-we-delete" className={h2Class}>
              What we delete
            </h2>
            <div className={proseClass}>
              <p>
                When you connect an Instagram professional account, we receive your account ID,
                username, profile picture, account type, the permissions you granted, an access
                token, and the IDs and links of the posts we publish for you. Your access token is
                deleted right away when you disconnect or remove our access. Everything else we
                received from Instagram is deleted within 30 days of your request.
              </p>
              <p>
                This doesn’t delete posts that are already on Instagram. You can delete those in the
                Instagram app.
              </p>
            </div>
          </section>

          <section aria-labelledby="how-to-delete" className="border-t border-slate-200 pt-8 pb-10">
            <h2 id="how-to-delete" className={h2Class}>
              How to request deletion
            </h2>
            <div className={proseClass}>
              <p>Use any one of these three ways:</p>
              <ol>
                <li>
                  <strong>In No Sweat.</strong> Log in, open the{" "}
                  <Link href="/social" className={textLink}>
                    Social
                  </Link>{" "}
                  page and choose <strong>Disconnect</strong> on your Instagram account.
                </li>
                <li>
                  <strong>In Instagram.</strong> Open Settings, go to{" "}
                  <strong>Apps and websites</strong>, find No Sweat and remove it. Instagram tells
                  us, and we delete your data. If you asked Instagram to delete your data, you’ll
                  get a confirmation code you can check on this page.
                </li>
                <li>
                  <strong>By email.</strong> Write to{" "}
                  <a href={`mailto:${CONTACT_EMAIL}?subject=Data%20deletion`} className={textLink}>
                    {CONTACT_EMAIL}
                  </a>{" "}
                  from the address on your account and include your Instagram username.
                </li>
              </ol>
            </div>
          </section>

          <section aria-labelledby="check-status" className="border-t border-slate-200 pt-8">
            <h2 id="check-status" className={h2Class}>
              Check a request
            </h2>
            <div className={proseClass}>
              <p>
                Enter the confirmation code you got from Instagram to see the status of your
                request.
              </p>
            </div>
            <form method="get" className="mt-6 flex max-w-[34rem] flex-col gap-3 sm:flex-row">
              <label htmlFor="code" className="sr-only">
                Confirmation code
              </label>
              <input
                id="code"
                name="code"
                required
                maxLength={64}
                autoComplete="off"
                placeholder="Confirmation code"
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base text-ink placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
              <button type="submit" className={primaryButton}>
                Check status
              </button>
            </form>
            <p className="mt-6 text-sm leading-relaxed text-slate-600">
              More about how we handle your information is in our{" "}
              <Link href="/privacy#connected-social-accounts" className={textLink}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
