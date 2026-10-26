import { TeamMemberResponse, UpdateTeamMemberRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deleteTeamMember, updateTeamMember } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/office/team/[id]: muda o membro (ou desativa com `active: false`). */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/team/[id]", async (user) => {
    const { id } = await params;
    const input = await readJson(request, UpdateTeamMemberRequest);
    if (!input.ok) return input.response;
    const member = await updateTeamMember(user.id, id, input.data);
    if (!member) return notFound("Team member");
    return jsonResponse(TeamMemberResponse, { member });
  });
}

/** DELETE /api/office/team/[id] → { ok: true }. O membro some dos jobs. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/team/[id]", async (user) => {
    const { id } = await params;
    if (!(await deleteTeamMember(user.id, id))) return notFound("Team member");
    return Response.json({ ok: true });
  });
}
