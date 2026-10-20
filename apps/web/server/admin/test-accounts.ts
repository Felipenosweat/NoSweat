import type { PlanId } from "@nosweat/schema";
import { z } from "zod";
import { passwordProblems, profileMetadata } from "@/lib/signup-rules";
import { isActiveStatus } from "../billing";
import { extendExpiry, getGrantStore } from "../billing/grants";
import { getBillingStore } from "../billing/store";
import { deleteSiteForever } from "../sites";
import { getSiteStore, type SiteRecord } from "../store";
import {
  AuthAdminError,
  createAuthUser,
  deleteAuthUser,
  serviceConfig,
  type ServiceConfig,
} from "./auth-api";
import { getAccount, isAdmin, listClients, type ClientAccount } from "./index";

// Contas de teste ("clientes" de mentira) que o admin cria para testar o produto como cliente.
// Criadas pela API de administração do Supabase Auth, já com e-mail confirmado e perfil completo
// (o proxy.ts não manda para o /welcome). Ficam marcadas com `test_account: true` no
// user_metadata e no app_metadata (ver ClientAccount.testAccount). Só elas podem ser apagadas
// pelo painel: nunca admins, nunca contas de verdade.

export const TEST_EMAIL_DOMAIN = "nosweatfd.com";
/** Dias de plano liberados junto com a conta de teste (quando o admin escolhe um plano). */
export const TEST_PLAN_DAYS = 30;
/** Data de nascimento fixa das contas de teste (maior de idade, como o cadastro exige). */
const TEST_BIRTH_DATE = "1990-01-01";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%*-_=+?";

/** Índice aleatório e uniforme em [0, max) (rejeita o resto para não favorecer nenhum). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0] ?? 0;
    if (value < limit) return value % max;
  }
}

function pick(chars: string): string {
  return chars.charAt(randomIndex(chars.length));
}

/**
 * Senha forte aleatória que passa em todas as regras do cadastro (PASSWORD_RULES): pelo menos
 * uma maiúscula, uma minúscula, um número e um símbolo. Sem caracteres parecidos (0/O, 1/l/I).
 */
export function generatePassword(length = 20): string {
  const size = Math.max(12, Math.min(64, length));
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < size) chars.push(pick(all));
  // Embaralha (Fisher-Yates) para os quatro obrigatórios não ficarem sempre no começo.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j] ?? "", chars[i] ?? ""];
  }
  const password = chars.join("");
  // Garantia extra: se um dia as regras mudarem, falha aqui e não na tela de login.
  if (passwordProblems(password).length > 0) return generatePassword(size);
  return password;
}

/** "test+k3x9q2@nosweatfd.com" (o "+algo" chega na caixa test@ do domínio). */
export function testAccountEmail(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += pick(alphabet);
  return `test+${suffix}@${TEST_EMAIL_DOMAIN}`;
}

/**
 * user_metadata de uma conta de teste: o mesmo perfil do cadastro (nome, data de nascimento,
 * aceite dos termos), sem lista de marketing, mais `test_account: true`.
 */
export function testAccountUserMetadata(
  number: number,
  adminId: string,
  now: Date = new Date(),
): Record<string, unknown> {
  return {
    ...profileMetadata(
      {
        firstName: "Test",
        lastName: `Client ${number}`,
        birthDate: TEST_BIRTH_DATE,
        marketing: false,
      },
      now,
    ),
    terms_accepted_at: now.toISOString(),
    test_account: true,
    created_by_admin: adminId,
  };
}

/** app_metadata (só a chave secreta muda): a marca que vale para poder apagar pelo painel. */
export function testAccountAppMetadata(adminId: string): Record<string, unknown> {
  return { test_account: true, created_by_admin: adminId };
}

const TestAccountInput = z.object({
  email: z.email("Please enter a valid email address.").max(254).optional(),
  plan: z.enum(["starter", "pro", "premium"]).nullable(),
});

export type CreatedTestAccount = {
  userId: string;
  email: string;
  password: string;
  plan: PlanId | null;
};

export class TestAccountError extends Error {}

/**
 * Cria a conta de teste "Test Client N" (N = quantas já existem + 1), com e-mail confirmado e,
 * se pedido, o plano liberado por TEST_PLAN_DAYS dias. A senha só existe na resposta: mostrar
 * uma vez e esquecer. Lança TestAccountError com uma mensagem para a tela.
 */
export async function createTestAccount(
  input: { email?: string; plan: PlanId | null },
  adminId: string,
  config: ServiceConfig | null = serviceConfig(),
): Promise<CreatedTestAccount> {
  if (!config) {
    throw new TestAccountError(
      "Test accounts need Supabase (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const parsed = TestAccountInput.safeParse(input);
  if (!parsed.success) {
    throw new TestAccountError(parsed.error.issues[0]?.message ?? "Invalid test account.");
  }
  const email = parsed.data.email?.trim().toLowerCase() || testAccountEmail();
  const existing = await listClients();
  const number = existing.filter((account) => account.testAccount).length + 1;
  const password = generatePassword();

  let userId: string;
  try {
    const user = await createAuthUser(config, {
      email,
      password,
      userMetadata: testAccountUserMetadata(number, adminId),
      appMetadata: testAccountAppMetadata(adminId),
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthAdminError) {
      if (
        error.code === "email_exists" ||
        error.code === "user_already_exists" ||
        /already (been )?registered|already exists/i.test(error.message)
      ) {
        throw new TestAccountError("An account with this email already exists.");
      }
      // Só admins veem esta mensagem: o motivo do Supabase ajuda a consertar (ex.: regra de senha).
      throw new TestAccountError(`Supabase didn't create the account. ${error.message}`);
    }
    console.error("[admin] could not create the test account", error);
    throw new TestAccountError("Supabase didn't create the account. Please try again.");
  }

  const plan = parsed.data.plan;
  if (plan) {
    await getGrantStore().upsert({
      userId,
      plan,
      expiresAt: extendExpiry(null, TEST_PLAN_DAYS),
      note: "Test account",
      grantedBy: adminId,
      updatedAt: new Date().toISOString(),
    });
  }
  return { userId, email, password, plan };
}

/**
 * Por que esta conta NÃO pode ser apagada pelo painel (`null` = pode). Só contas de teste;
 * nunca um admin, nunca a própria conta.
 */
export function testAccountDeleteBlocker(
  account: Pick<ClientAccount, "id" | "testAccount"> | null,
  opts: { targetIsAdmin: boolean; actorId: string },
): string | null {
  if (!account) return "Account not found.";
  if (account.id === opts.actorId) return "You can't delete your own account.";
  if (opts.targetIsAdmin) return "Admin accounts can't be deleted.";
  if (!account.testAccount) return "Only test accounts can be deleted here.";
  return null;
}

/**
 * Por que esta conta NÃO pode ser apagada pelo painel (`null` = pode), para qualquer conta (pedido
 * de exclusão de um cliente de verdade): nunca um admin, nunca a própria conta. Conta de verdade
 * exige digitar o e-mail dela (ou o id, se não tiver e-mail); conta de teste não.
 */
export function accountDeleteBlocker(
  account: Pick<ClientAccount, "id" | "email" | "testAccount"> | null,
  opts: { targetIsAdmin: boolean; actorId: string; confirmEmail?: string | null },
): string | null {
  if (!account) return "Account not found.";
  if (account.id === opts.actorId) return "You can't delete your own account.";
  if (opts.targetIsAdmin) return "Admin accounts can't be deleted.";
  if (!account.testAccount) {
    const expected = (account.email ?? account.id).trim().toLowerCase();
    const typed = (opts.confirmEmail ?? "").trim().toLowerCase();
    if (typed !== expected) {
      return account.email
        ? "Type the account's email exactly to confirm."
        : "Type the account's id exactly to confirm.";
    }
  }
  return null;
}

export type DeleteTestAccountDeps = {
  getAccount: (id: string) => Promise<ClientAccount | null>;
  isAdmin: (id: string) => Promise<boolean>;
  listSites: (ownerId: string) => Promise<SiteRecord[]>;
  deleteSite: (site: SiteRecord) => Promise<unknown>;
  deleteAuthUser: (id: string) => Promise<void>;
  /**
   * `true` se a conta tem assinatura do Stripe ativa (apagar a conta não para a cobrança no
   * Stripe). Sem esta função, não confere.
   */
  hasActiveSubscription?: (id: string) => Promise<boolean>;
};

function defaultDeleteDeps(): DeleteTestAccountDeps {
  return {
    getAccount,
    isAdmin,
    listSites: (ownerId) => getSiteStore().list(ownerId),
    deleteSite: deleteSiteForever,
    deleteAuthUser: async (id) => {
      const config = serviceConfig();
      if (!config) throw new TestAccountError("Deleting accounts needs Supabase.");
      await deleteAuthUser(config, id);
    },
    hasActiveSubscription: async (id) => {
      const sub = await getBillingStore().get(id);
      return isActiveStatus(sub?.status ?? null);
    },
  };
}

export type DeleteTestAccountResult =
  | { ok: true; email: string | null; sitesDeleted: number }
  | { ok: false; error: string };

/** Sites primeiro (libera os domínios na Vercel), depois a conta no Supabase Auth. */
async function deleteAccountAndSites(
  account: ClientAccount,
  deps: DeleteTestAccountDeps,
): Promise<DeleteTestAccountResult> {
  const sites = await deps.listSites(account.id);
  for (const site of sites) await deps.deleteSite(site);
  await deps.deleteAuthUser(account.id);
  return { ok: true, email: account.email, sitesDeleted: sites.length };
}

/**
 * Apaga uma conta de teste: primeiro os sites (pelo mesmo caminho do DELETE /api/sites/[id], que
 * libera os domínios na Vercel), depois a conta no Supabase Auth (o resto sai em cascata: planos,
 * uso da IA, clientes, redes sociais). Recusa qualquer conta que não seja de teste.
 */
export async function deleteTestAccount(
  targetId: string,
  actorId: string,
  deps: DeleteTestAccountDeps = defaultDeleteDeps(),
): Promise<DeleteTestAccountResult> {
  const account = await deps.getAccount(targetId);
  const targetIsAdmin = account ? await deps.isAdmin(account.id) : false;
  const blocker = testAccountDeleteBlocker(account, { targetIsAdmin, actorId });
  if (blocker || !account) return { ok: false, error: blocker ?? "Account not found." };
  return deleteAccountAndSites(account, deps);
}

/**
 * Apaga qualquer conta que não seja admin nem a própria (ex.: um cliente pediu a exclusão dos
 * dados, como prometem os Termos e a Privacidade). Mesmo caminho da conta de teste: sites antes
 * (domínios liberados), depois a conta. Conta de verdade exige o e-mail digitado e não pode ter
 * assinatura do Stripe ativa (cancelar no Stripe antes, senão a cobrança continua).
 */
export async function deleteAccount(
  targetId: string,
  actorId: string,
  options: { confirmEmail?: string | null } = {},
  deps: DeleteTestAccountDeps = defaultDeleteDeps(),
): Promise<DeleteTestAccountResult> {
  const account = await deps.getAccount(targetId);
  const targetIsAdmin = account ? await deps.isAdmin(account.id) : false;
  const blocker = accountDeleteBlocker(account, {
    targetIsAdmin,
    actorId,
    confirmEmail: options.confirmEmail,
  });
  if (blocker || !account) return { ok: false, error: blocker ?? "Account not found." };
  if (deps.hasActiveSubscription && (await deps.hasActiveSubscription(account.id))) {
    return {
      ok: false,
      error: "This account has an active card subscription. Cancel it in Stripe first.",
    };
  }
  return deleteAccountAndSites(account, deps);
}
