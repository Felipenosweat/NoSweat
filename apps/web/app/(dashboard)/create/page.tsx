import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth/session";
import { CreateFlow } from "./CreateFlow";

export const metadata: Metadata = { title: "Create your website" };

type CreatePageProps = {
  searchParams: Promise<{ brief?: string | string[]; start?: string | string[] }>;
};

// A landing manda o visitante para /create?brief=…&start=1 (o mesmo texto também fica no
// sessionStorage `ns-brief`, lido no cliente quando não há parâmetro). Com `start=1` o site
// começa a ser montado na hora, com layout e cores escolhidos pela No Sweat (um clique só).
export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { brief, start } = await searchParams;
  const initialBrief = (Array.isArray(brief) ? brief[0] : brief)?.trim().slice(0, 2000) ?? "";
  // Visitante ou conta: muda a mensagem do limite diário e o aviso do rascunho no fim.
  const signedIn = Boolean(await getCurrentUser());
  const autoStart = (Array.isArray(start) ? start[0] : start) === "1";
  return <CreateFlow initialBrief={initialBrief} signedIn={signedIn} autoStart={autoStart} />;
}
