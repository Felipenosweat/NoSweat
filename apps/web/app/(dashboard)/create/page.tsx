import type { Metadata } from "next";
import { aiEnabled } from "@/server/ai";
import { getCurrentUser } from "@/server/auth/session";
import { creditCost, getBalance } from "@/server/credits";
import { CreateFlow, type CreateCredits } from "./CreateFlow";

export const metadata: Metadata = { title: "Create your website" };

type CreatePageProps = {
  searchParams: Promise<{ brief?: string | string[]; start?: string | string[] }>;
};

/**
 * Custo de criar um site e o saldo, para avisar antes de criar. Só contas com créditos e com a IA
 * ligada (sem IA o site sai de modelo, sem cobrança). Admin (sem limite) ou erro: sem aviso.
 */
async function createCredits(userId: string): Promise<CreateCredits | null> {
  if (!aiEnabled()) return null;
  try {
    const balance = await getBalance({ id: userId });
    if (balance.unlimited) return null;
    return { cost: creditCost("generate"), left: balance.total };
  } catch (error) {
    console.error("[credits] could not read the balance for /create", error);
    return null;
  }
}

// A landing manda o visitante para /create?brief=…&start=1 (o mesmo texto também fica no
// sessionStorage `ns-brief`, lido no cliente quando não há parâmetro). Com `start=1` o site
// começa a ser montado na hora, com layout e cores escolhidos pela No Sweat (um clique só).
export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { brief, start } = await searchParams;
  const initialBrief = (Array.isArray(brief) ? brief[0] : brief)?.trim().slice(0, 2000) ?? "";
  // Visitante ou conta: muda a mensagem do limite diário e o aviso do rascunho no fim.
  const user = await getCurrentUser();
  const autoStart = (Array.isArray(start) ? start[0] : start) === "1";
  return (
    <CreateFlow
      initialBrief={initialBrief}
      signedIn={Boolean(user)}
      autoStart={autoStart}
      credits={user ? await createCredits(user.id) : null}
    />
  );
}
