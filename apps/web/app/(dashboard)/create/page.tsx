import type { Metadata } from "next";
import { aiEnabled } from "@/server/ai";
import { getCurrentUser } from "@/server/auth/session";
import { creditCost, getBalance } from "@/server/credits";
import { RememberPlan } from "@/components/RememberPlan";
import { landingName } from "./brief";
import { CreateFlow, type CreateCredits } from "./CreateFlow";

export const metadata: Metadata = { title: "Create your website" };

type CreatePageProps = {
  searchParams: Promise<{
    brief?: string | string[];
    name?: string | string[];
    start?: string | string[];
    plan?: string | string[];
  }>;
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

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// A landing manda o visitante para /create?brief=…&name=…&start=1 (o mesmo texto e o nome
// também ficam no sessionStorage `ns-brief`/`ns-brief-name`, lidos no cliente quando não há
// parâmetro). O nome vai à parte: é o nome do site, seja qual for o gerador. Com `start=1` o
// site começa a ser montado na hora, com layout e cores escolhidos pela No Sweat (um clique só).
// `plan` (botões da /pricing): guardado num cookie para o /billing destacar o plano escolhido.
export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { brief, name, start, plan } = await searchParams;
  const initialBrief = first(brief)?.trim().slice(0, 2000) ?? "";
  const initialName = landingName(first(name));
  // Visitante ou conta: muda a mensagem do limite diário e o aviso do rascunho no fim.
  const user = await getCurrentUser();
  const autoStart = first(start) === "1";
  return (
    <>
      <RememberPlan plan={first(plan)} />
      <CreateFlow
        initialBrief={initialBrief}
        initialName={initialName}
        signedIn={Boolean(user)}
        autoStart={autoStart}
        credits={user ? await createCredits(user.id) : null}
      />
    </>
  );
}
