"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PASSWORD_MAX, passwordProblems, profileSchema } from "@/lib/signup-rules";
import { createSupabaseServerClient } from "@/server/auth/session";
import { getViewer } from "@/server/auth/viewer";

// Configurações da conta (/account): nome e senha. O e-mail de login só aparece (trocar o e-mail
// exige a confirmação dupla do Supabase, que fica para depois). Apagar a conta é um pedido por
// e-mail, como dizem os Termos e a Privacidade.

export type ProfileState = {
  error?: string;
  fieldErrors?: { firstName?: string; lastName?: string };
  values?: { firstName: string; lastName: string };
  /** Mensagem de sucesso. */
  saved?: string;
};

export type PasswordState = {
  error?: string;
  fieldErrors?: { password?: string; passwordConfirm?: string };
  /** Mensagem de sucesso. */
  saved?: string;
  /** Quantas vezes a senha foi trocada nesta tela (limpa os campos depois de salvar). */
  savedCount?: number;
  /** O Supabase pediu para confirmar a identidade de novo: mostra o caminho do e-mail. */
  needsReset?: boolean;
};

const READ_ONLY = "You’re viewing another account. Account settings are read-only.";
const LOGIN_OFF = "Accounts are turned off on this server.";

/** Só a própria conta (nunca no modo "ver como" do admin). `null` = pode seguir. */
async function blockedReason(): Promise<string | null> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/account")}`);
  if (viewer.viewingAs) return READ_ONLY;
  return null;
}

const nameSchema = profileSchema().pick({ firstName: true, lastName: true });

/** Nome e sobrenome (os mesmos limites do cadastro). */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const values = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
  };
  const blocked = await blockedReason();
  if (blocked) return { values, error: blocked };

  const parsed = nameSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: NonNullable<ProfileState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "firstName" || field === "lastName") fieldErrors[field] ??= issue.message;
    }
    return { values, fieldErrors, error: "Please fix the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { values, error: LOGIN_OFF };

  const { firstName, lastName } = parsed.data;
  const { error } = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
  });
  if (error) {
    console.error("[account] profile update failed", error.code ?? "no_code", error.status);
    return { values, error: "We couldn’t save your name. Please try again." };
  }
  // Sessão nova: o token passa a trazer o nome novo (a saudação do painel lê dele).
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return { values: { firstName, lastName }, saved: "Your name was saved." };
}

/** Senha nova + confirmação, com as mesmas regras do cadastro (lib/signup-rules). */
export async function changePassword(
  prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const savedCount = prev.savedCount ?? 0;
  const blocked = await blockedReason();
  if (blocked) return { savedCount, error: blocked };

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const fieldErrors: NonNullable<PasswordState["fieldErrors"]> = {};
  const problems = passwordProblems(password);
  if (!password) fieldErrors.password = "Please enter a new password.";
  else if (password.length > PASSWORD_MAX)
    fieldErrors.password = `Password must be at most ${PASSWORD_MAX} characters.`;
  else if (problems.length > 0)
    fieldErrors.password = `Your password needs: ${problems.join(", ").toLowerCase()}.`;
  if (!passwordConfirm) fieldErrors.passwordConfirm = "Please type your new password again.";
  else if (password !== passwordConfirm) fieldErrors.passwordConfirm = "The passwords don’t match.";
  if (fieldErrors.password || fieldErrors.passwordConfirm) {
    return { savedCount, fieldErrors, error: "Please fix the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { savedCount, error: LOGIN_OFF };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    switch (error.code) {
      case "same_password":
        return {
          savedCount,
          fieldErrors: { password: "That’s your current password. Please choose a new one." },
          error: "Please fix the highlighted fields.",
        };
      case "weak_password":
        return {
          savedCount,
          fieldErrors: {
            password: "That password is too easy to guess or has appeared in a data breach.",
          },
          error: "Please choose a different password.",
        };
      case "reauthentication_needed":
        return {
          savedCount,
          needsReset: true,
          error: "For your security, please change your password with a link sent to your email.",
        };
      case "session_not_found":
      case "session_expired":
        return redirect(`/login?next=${encodeURIComponent("/account")}`);
      case "over_request_rate_limit":
        return { savedCount, error: "Too many attempts. Please wait a few minutes and try again." };
      default:
        console.error("[account] password update failed", error.code ?? "no_code", error.status);
        return { savedCount, error: "We couldn’t change your password. Please try again." };
    }
  }

  // A senha mudou: quem estiver logado em outro aparelho sai. Esta sessão continua.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) console.error("[account] could not sign out other sessions", signOutError.code);
  return {
    savedCount: savedCount + 1,
    saved: "Your password was changed. Other devices were logged out.",
  };
}
