import {
  OnboardingRequest,
  OnboardingResponse,
  TOUR_METADATA_KEY,
  tourDoneAt,
} from "@/lib/onboarding";
import {
  createSupabaseServerClient,
  getCurrentUser,
  getSessionClaims,
} from "@/server/auth/session";
import { errorResponse, handle, jsonResponse, readJson, unauthorized } from "@/server/http";

/**
 * POST /api/me/onboarding `{ tour: "done" }` → marca que a conta já viu o tour de boas-vindas
 * (`user_metadata.onboarding_tour_done_at`), para ele abrir sozinho uma vez só por conta.
 * A própria pessoa atualiza o próprio metadata (cliente do Supabase com os cookies dela). Se a
 * data já está no token, devolve a mesma sem gravar de novo (rever o tour não reescreve).
 * Sem Supabase (dev local, DEV_USER) não há onde gravar: responde `stored: "local"`.
 * No modo "ver como" do admin o proxy.ts recusa esta escrita (403) antes de chegar aqui.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const parsed = await readJson(request, OnboardingRequest);
    if (!parsed.ok) return parsed.response;

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return jsonResponse(OnboardingResponse, {
        doneAt: new Date().toISOString(),
        stored: "local",
      });
    }

    const claims = await getSessionClaims();
    const existing = tourDoneAt(claims?.user_metadata);
    if (existing) return jsonResponse(OnboardingResponse, { doneAt: existing, stored: "account" });

    const doneAt = new Date().toISOString();
    // `data` é juntado ao user_metadata que já existe (o resto do perfil fica como está).
    const { error } = await supabase.auth.updateUser({ data: { [TOUR_METADATA_KEY]: doneAt } });
    if (error) {
      console.error("[onboarding] could not save the tour flag", error.message);
      return errorResponse(500, "internal_error", "We couldn't save that. Please try again.");
    }
    // Sessão nova: o próximo token já traz a data (o painel lê das claims e não abre de novo).
    await supabase.auth.refreshSession();
    return jsonResponse(OnboardingResponse, { doneAt, stored: "account" });
  }, "/api/me/onboarding");
}
