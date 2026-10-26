import { JobResponse, UpdateJobRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deleteJob, getJob, updateJob } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/office/jobs/[id] (job de outra pessoa = 404). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/jobs/[id]", async (user) => {
    const { id } = await params;
    const job = await getJob(user.id, id);
    if (!job) return notFound("Job");
    return jsonResponse(JobResponse, { job });
  });
}

/** PATCH /api/office/jobs/[id]: dados, horário, equipe ou status. */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/jobs/[id]", async (user) => {
    const { id } = await params;
    const input = await readJson(request, UpdateJobRequest);
    if (!input.ok) return input.response;
    const job = await updateJob(user.id, id, input.data);
    if (!job) return notFound("Job");
    return jsonResponse(JobResponse, { job });
  });
}

/** DELETE /api/office/jobs/[id] → { ok: true }. Orçamento e fatura ligados continuam. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/jobs/[id]", async (user) => {
    const { id } = await params;
    if (!(await deleteJob(user.id, id))) return notFound("Job");
    return Response.json({ ok: true });
  });
}
