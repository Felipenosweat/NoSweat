import { cookies } from "next/headers";
import { cache } from "react";
import { getAccount, isAdmin } from "../admin";
import { getCurrentUser } from "./session";
import { resolveViewer, VIEW_AS_COOKIE, type Viewer } from "./view-as-token";

export type { Viewer, ViewingAs } from "./view-as-token";

/**
 * Quem está olhando o painel e de quem são os dados (`ownerId`). `null` = ninguém logado.
 * Com o cookie `ns_view_as` válido de um admin, `ownerId` é a conta vista e `viewingAs` vem
 * preenchido (modo "ver como", só leitura: o proxy.ts bloqueia as escritas na API).
 * Só as páginas de leitura usam isto; as rotas da API continuam com getCurrentUser().
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const token = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!token) return { user, ownerId: user.id, viewingAs: null };
  try {
    return await resolveViewer({
      user,
      token,
      isAdmin,
      findAccount: async (id) => {
        const account = await getAccount(id);
        return account ? { id: account.id, email: account.email } : null;
      },
    });
  } catch (error) {
    // Falha ao achar a conta vista: mostra a própria conta (nunca dados de outra pessoa por engano).
    console.error("[view-as] could not resolve the viewed account", error);
    return { user, ownerId: user.id, viewingAs: null };
  }
});
