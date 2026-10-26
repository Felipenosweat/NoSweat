import { CreateJobRequest, JobResponse, JobStatus, JobsResponse } from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute, queryParam } from "@/server/office/api";
import { createJob, listJobs } from "@/server/office/service";

/**
 * GET /api/office/jobs?from=&to=&status=&clientId=: agenda. `from`/`to` aceitam data
 * (AAAA-MM-DD, dia inteiro no fuso da empresa; `to` inclui o dia) ou data-hora ISO (`to`
 * exclusivo). Com período, os jobs sem data só vêm com `status=unscheduled`.
 */
export async function GET(request: Request): Promise<Response> {
  return ownerRoute("/api/office/jobs", async (user) => {
    const params = new URL(request.url).searchParams;
    const jobs = await listJobs(user.id, {
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      status: queryParam(params, "status", JobStatus),
      clientId: params.get("clientId") || undefined,
    });
    return jsonResponse(JobsResponse, { jobs });
  });
}

/** POST /api/office/jobs: job novo (com horário já nasce "scheduled"). */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/jobs", async (user) => {
    const input = await readJson(request, CreateJobRequest);
    if (!input.ok) return input.response;
    const job = await createJob(user.id, input.data);
    return jsonResponse(JobResponse, { job }, 201);
  });
}
