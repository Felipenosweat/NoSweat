import { AssistantTranscriptResponse } from "@nosweat/schema";
import { assistantTranscript } from "@/server/assistant/service";
import { handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { requireOwnedSite } from "@/server/sites";

type Context = { params: Promise<{ id: string; conversationId: string }> };

/** GET /api/sites/[id]/assistant/conversations/[conversationId] → a conversa inteira (só o dono). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id, conversationId } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    const transcript = await assistantTranscript(site, conversationId);
    if (!transcript) return notFound("Conversation");
    return jsonResponse(AssistantTranscriptResponse, transcript);
  }, "/api/sites/[id]/assistant/conversations/[conversationId]");
}
