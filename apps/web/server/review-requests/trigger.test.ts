import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../clients/service";
import { resetMemoryClientStore } from "../clients/store";
import { createJob, updateJob } from "../office/service";
import { resetMemoryOfficeStore } from "../office/store";
import type * as ServiceModule from "./service";

// O job virar "done" (e só isso) agenda o pedido automático. O envio em si é testado em
// service.test.ts; aqui o agendamento é trocado por um espião.

const scheduleAutoReviewRequest = vi.hoisted(() =>
  vi.fn<(ownerId: string, jobId: string) => void>(),
);

vi.mock("./service", async (importOriginal) => ({
  ...(await importOriginal<typeof ServiceModule>()),
  scheduleAutoReviewRequest,
}));

const OWNER = "11111111-2222-4333-8444-555555555555";

beforeEach(() => {
  resetMemoryClientStore();
  resetMemoryOfficeStore();
  scheduleAutoReviewRequest.mockClear();
});

describe("updateJob → automatic review request", () => {
  it("schedules once when the job changes to done", async () => {
    const client = await createClient(OWNER, { name: "Maria", email: "maria@x.test" });
    const job = await createJob(OWNER, { clientId: client.id, title: "Fix the sink" });

    await updateJob(OWNER, job.id, { notes: "Bring the wrench" });
    expect(scheduleAutoReviewRequest).not.toHaveBeenCalled();

    await updateJob(OWNER, job.id, { status: "done" });
    expect(scheduleAutoReviewRequest).toHaveBeenCalledTimes(1);
    expect(scheduleAutoReviewRequest).toHaveBeenCalledWith(OWNER, job.id);

    // Já estava "done": salvar de novo não agenda outro.
    await updateJob(OWNER, job.id, { status: "done", notes: "Paid in cash" });
    expect(scheduleAutoReviewRequest).toHaveBeenCalledTimes(1);
  });
});
