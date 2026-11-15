import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isAdmin } from "@/server/admin";
import { getCurrentUser } from "@/server/auth/session";
import { recordPreviewView } from "@/server/prospects/claim";
import { getPublicPreview } from "@/server/prospects/service";
import type { ProspectRecord } from "@/server/prospects/types";
import { PreviewBarOffset } from "./PreviewBarOffset";

// Prévia que a No Sweat fez para uma empresa da prospecção (/admin/prospects), aberta pelo link
// /p/<token> do e-mail ou da ligação. Público (sem login) e nunca indexado. Mostra o RASCUNHO do
// site com uma faixa no topo deixando claro que não é o site oficial da empresa. Sem formulário
// de contato funcionando (nenhum pedido vai para lugar nenhum) e com o selo da No Sweat.
// "Make it yours" é um POST para /p/<token>/claim: quem clica ganha uma cópia deste site e cai
// no editor (server/prospects/claim.ts). Cada abertura conta para o admin saber quem olhou.

type PreviewPageProps = { params: Promise<{ token: string }> };

const load = cache(async (token: string) => getPublicPreview(token));

const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { token } = await params;
  const preview = await load(token);
  return {
    title: preview
      ? { absolute: `${preview.prospect.name} · preview by No Sweat` }
      : "Preview not found",
    robots: NO_INDEX,
    // O token não vaza para outros sites pelo Referer.
    referrer: "no-referrer",
  };
}

/** Conta a abertura (menos as do próprio admin e de robôs). Nunca derruba a página. */
async function countView(prospect: ProspectRecord): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (user && (await isAdmin(user.id))) return;
    await recordPreviewView(prospect, (await headers()).get("user-agent"));
  } catch {
    // Fora de um request (testes) ou sessão ilegível: só não conta.
  }
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default async function ProspectPreviewPage({ params }: PreviewPageProps) {
  await connection();
  const { token } = await params;
  const preview = await load(token);
  if (!preview) notFound();
  const business = preview.prospect.name;
  await countView(preview.prospect);

  return (
    <>
      {/* Faixa da No Sweat: fica fora do site, grudada no topo, e diz o que é isto sem rodeio. */}
      <div
        id="ns-preview-bar"
        role="region"
        aria-label="About this preview"
        className="sticky top-0 z-50 bg-slate-950 px-4 py-2.5 text-xs leading-[1.45] text-slate-300 sm:py-3 sm:text-sm"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-6">
          <p className="min-w-0">
            A preview <span className="font-semibold text-white">No Sweat</span> made for{" "}
            <span className="font-semibold text-white">{business}</span>. It isn&rsquo;t live and
            isn&rsquo;t affiliated with {business} until they say so.
          </p>
          <form method="post" action={`/p/${token}/claim`} className="shrink-0">
            <button
              type="submit"
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-emerald-500 px-3.5 text-[13px] font-semibold whitespace-nowrap text-white hover:bg-emerald-400 sm:px-4 sm:text-sm ${focusRing}`}
            >
              Make it yours &rarr;
            </button>
          </form>
        </div>
      </div>
      <PreviewBarOffset targetId="ns-preview-bar" />
      {/* O menu fixo do site desce para baixo da faixa. */}
      <style>{`.ns-nav{top:calc(var(--ns-preview-bar,0px) + 1rem)}`}</style>
      <SiteRenderer spec={preview.site.spec} />
    </>
  );
}
