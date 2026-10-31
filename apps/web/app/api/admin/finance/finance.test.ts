import {
  ApiError,
  CompanyExpenseResponse,
  CompanyExpensesResponse,
  DeleteCompanyExpenseResponse,
} from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetMemoryExpenseStore } from "@/server/admin/finance-store";
import { DELETE as deleteRoute, PATCH as patchRoute } from "./expenses/[id]/route";
import { GET as listRoute, POST as createRoute } from "./expenses/route";

// Sem Supabase: o usuário é o DEV_USER e tudo roda em memória. Admin só com DEV_ADMIN=true
// (como em api.test.ts, "platform admins").

const BASE = "http://localhost/api/admin/finance/expenses";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function errorCode(res: Response): Promise<string> {
  return ApiError.parse(await res.json()).error.code;
}

const hosting = {
  name: "Vercel Pro",
  category: "hosting",
  amountCents: 2000,
  frequency: "monthly",
};

beforeEach(() => resetMemoryExpenseStore());
afterEach(() => {
  delete process.env.DEV_ADMIN;
});

describe("/api/admin/finance/expenses for someone who isn't an admin", () => {
  it("answers 404 to every method and saves nothing", async () => {
    const list = await listRoute();
    expect(list.status).toBe(404);
    expect(await errorCode(list)).toBe("not_found");

    const create = await createRoute(jsonRequest(BASE, "POST", hosting));
    expect(create.status).toBe(404);

    const id = crypto.randomUUID();
    expect(
      (await patchRoute(jsonRequest(`${BASE}/${id}`, "PATCH", { amountCents: 1 }), ctx(id))).status,
    ).toBe(404);
    expect(
      (await deleteRoute(new Request(`${BASE}/${id}`, { method: "DELETE" }), ctx(id))).status,
    ).toBe(404);

    process.env.DEV_ADMIN = "true";
    const after = CompanyExpensesResponse.parse(await (await listRoute()).json());
    expect(after.expenses).toEqual([]);
  });
});

describe("/api/admin/finance/expenses for an admin", () => {
  beforeEach(() => {
    process.env.DEV_ADMIN = "true";
  });

  it("creates, lists, updates and deletes a cost", async () => {
    const create = await createRoute(
      jsonRequest(BASE, "POST", { ...hosting, startsOn: "2026-01-01", notes: "Team plan" }),
    );
    expect(create.status).toBe(201);
    const { expense } = CompanyExpenseResponse.parse(await create.json());
    expect(expense).toMatchObject({
      ...hosting,
      startsOn: "2026-01-01",
      endsOn: null,
      notes: "Team plan",
    });

    const list = CompanyExpensesResponse.parse(await (await listRoute()).json());
    expect(list.expenses.map((item) => item.id)).toEqual([expense.id]);

    const patch = await patchRoute(
      jsonRequest(`${BASE}/${expense.id}`, "PATCH", { amountCents: 2400, endsOn: "2026-12-31" }),
      ctx(expense.id),
    );
    expect(patch.status).toBe(200);
    expect(CompanyExpenseResponse.parse(await patch.json()).expense).toMatchObject({
      amountCents: 2400,
      endsOn: "2026-12-31",
    });

    const del = await deleteRoute(
      new Request(`${BASE}/${expense.id}`, { method: "DELETE" }),
      ctx(expense.id),
    );
    expect(DeleteCompanyExpenseResponse.parse(await del.json())).toEqual({ deleted: true });

    const again = await deleteRoute(
      new Request(`${BASE}/${expense.id}`, { method: "DELETE" }),
      ctx(expense.id),
    );
    expect(again.status).toBe(404);
  });

  it("starts a cost today when no start date is sent", async () => {
    const res = await createRoute(jsonRequest(BASE, "POST", hosting));
    const { expense } = CompanyExpenseResponse.parse(await res.json());
    expect(expense.startsOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("refuses invalid input with the standard error", async () => {
    const bad = await createRoute(jsonRequest(BASE, "POST", { ...hosting, amountCents: -5 }));
    expect(bad.status).toBe(400);
    expect(await errorCode(bad)).toBe("invalid_request");

    const created = CompanyExpenseResponse.parse(
      await (
        await createRoute(jsonRequest(BASE, "POST", { ...hosting, startsOn: "2026-05-01" }))
      ).json(),
    ).expense;

    // O fim antes do começo que já estava salvo: o schema não vê, o servidor confere.
    const backwards = await patchRoute(
      jsonRequest(`${BASE}/${created.id}`, "PATCH", { endsOn: "2026-04-01" }),
      ctx(created.id),
    );
    expect(backwards.status).toBe(400);
    expect(await errorCode(backwards)).toBe("invalid_request");

    const empty = await patchRoute(
      jsonRequest(`${BASE}/${created.id}`, "PATCH", {}),
      ctx(created.id),
    );
    expect(empty.status).toBe(400);

    const missing = crypto.randomUUID();
    const notFound = await patchRoute(
      jsonRequest(`${BASE}/${missing}`, "PATCH", { amountCents: 1 }),
      ctx(missing),
    );
    expect(notFound.status).toBe(404);
    expect(await errorCode(notFound)).toBe("not_found");
  });
});
