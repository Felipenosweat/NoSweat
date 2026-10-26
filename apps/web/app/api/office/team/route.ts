import { CreateTeamMemberRequest, TeamMemberResponse, TeamResponse } from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { createTeamMember, listTeam } from "@/server/office/service";

/** GET /api/office/team: equipe (ativos e inativos), por nome. */
export async function GET(): Promise<Response> {
  return ownerRoute("/api/office/team", async (user) => {
    const members = await listTeam(user.id);
    return jsonResponse(TeamResponse, { members });
  });
}

/** POST /api/office/team: membro novo (sem cor, ganha a primeira livre). */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/team", async (user) => {
    const input = await readJson(request, CreateTeamMemberRequest);
    if (!input.ok) return input.response;
    const member = await createTeamMember(user.id, input.data);
    return jsonResponse(TeamMemberResponse, { member }, 201);
  });
}
