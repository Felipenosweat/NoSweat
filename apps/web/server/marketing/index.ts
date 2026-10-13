import { after } from "next/server";
import { getContactStore, type ContactStore } from "./contacts";
import { sendWelcomeEmail, type MarketingEnv } from "./welcome-email";

export { getContactStore, MemoryContactStore, normalizeEmail } from "./contacts";
export { isValidUnsubscribeToken, unsubscribePageUrl } from "./unsubscribe-link";
export { buildWelcomeEmail, sendWelcomeEmail } from "./welcome-email";

export type LaunchListInput = {
  userId: string;
  email: string | null;
  firstName: string | null;
  /** A pessoa marcou "Email me about the launch" (user_metadata.marketing_opt_in). */
  optedIn: boolean;
  /** Origem do app para os links do e-mail. */
  origin: string;
};

/**
 * Coloca na lista de lançamento quem pediu e manda o e-mail de boas-vindas UMA vez.
 * Chamado depois de confirmar o e-mail (callback), no cadastro com sessão imediata e ao
 * completar o perfil. Nunca lança: e-mail de marketing não pode atrapalhar o login.
 */
export async function joinLaunchList(
  input: LaunchListInput,
  store: ContactStore = getContactStore(),
  env: MarketingEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<"skipped" | "already_listed" | "added"> {
  if (!input.optedIn || !input.email) return "skipped";
  try {
    const isNew = await store.add({
      email: input.email,
      userId: input.userId,
      firstName: input.firstName,
    });
    if (!isNew) return "already_listed";
    const result = await sendWelcomeEmail(
      { email: input.email, firstName: input.firstName, origin: input.origin },
      env,
      fetchImpl,
    );
    if (result.sent) await store.markWelcomeSent(input.email);
    return "added";
  } catch (error) {
    console.error("[marketing] could not add to the launch list", error);
    return "skipped";
  }
}

/** Igual a joinLaunchList, mas depois da resposta (não atrasa o login). */
export function joinLaunchListLater(input: LaunchListInput): void {
  const task = async () => {
    await joinLaunchList(input);
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

/** Lê os campos de marketing do user_metadata do Supabase. */
export function marketingFromMetadata(metadata: unknown): {
  optedIn: boolean;
  firstName: string | null;
} {
  const m = (metadata && typeof metadata === "object" ? metadata : {}) as Record<string, unknown>;
  return {
    optedIn: m.marketing_opt_in === true,
    firstName: typeof m.first_name === "string" ? m.first_name : null,
  };
}
