import { serviceConfig, setAuthUserLoginDisabled } from "./auth-api";
import { getAccount, isAdmin, type ClientAccount } from "./index";

// "Desligar login" de uma conta pelo painel (ban do Supabase Auth). É o jeito de bloquear uma
// conta de verdade sem apagar os dados dela (proteção de dados: nada some, dá para religar).
// Nunca para admins e nunca para a própria conta.

export class AccountAccessError extends Error {}

/** Por que o login desta conta NÃO pode ser mudado pelo painel (`null` = pode). */
export function loginChangeBlocker(
  account: Pick<ClientAccount, "id"> | null,
  opts: { targetIsAdmin: boolean; actorId: string },
): string | null {
  if (!account) return "Account not found.";
  if (account.id === opts.actorId) return "You can't disable your own login.";
  if (opts.targetIsAdmin) return "Admin accounts can't be disabled here.";
  return null;
}

export type LoginAccessDeps = {
  getAccount: (id: string) => Promise<ClientAccount | null>;
  isAdmin: (id: string) => Promise<boolean>;
  setLoginDisabled: (id: string, disabled: boolean) => Promise<void>;
};

function defaultDeps(): LoginAccessDeps {
  return {
    getAccount,
    isAdmin,
    setLoginDisabled: async (id, disabled) => {
      const config = serviceConfig();
      if (!config) throw new AccountAccessError("Disabling logins needs Supabase.");
      await setAuthUserLoginDisabled(config, id, disabled);
    },
  };
}

export type LoginAccessResult = { ok: true; email: string | null } | { ok: false; error: string };

/** Desliga (`disabled = true`) ou religa o login da conta. Não mexe em sites nem em planos. */
export async function setLoginDisabled(
  targetId: string,
  actorId: string,
  disabled: boolean,
  deps: LoginAccessDeps = defaultDeps(),
): Promise<LoginAccessResult> {
  const account = await deps.getAccount(targetId);
  const targetIsAdmin = account ? await deps.isAdmin(account.id) : false;
  const blocker = loginChangeBlocker(account, { targetIsAdmin, actorId });
  if (blocker || !account) return { ok: false, error: blocker ?? "Account not found." };
  await deps.setLoginDisabled(account.id, disabled);
  return { ok: true, email: account.email };
}
