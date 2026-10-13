import type { Metadata } from "next";
import { CreateFlow } from "./CreateFlow";

export const metadata: Metadata = { title: "Create your website" };

type CreatePageProps = { searchParams: Promise<{ brief?: string | string[] }> };

// A landing manda o visitante para /create?brief=… (o mesmo texto também fica no
// sessionStorage `ns-brief`, lido no cliente quando não há parâmetro).
export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { brief } = await searchParams;
  const initialBrief = (Array.isArray(brief) ? brief[0] : brief)?.trim().slice(0, 2000) ?? "";
  return <CreateFlow initialBrief={initialBrief} />;
}
