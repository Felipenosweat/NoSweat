import { fixtures } from "@nosweat/fixtures";
import { ApiError, ASSISTANT_MAX_MESSAGES, AssistantChatResponse } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as chatRoute } from "@/app/api/public/sites/[id]/assistant/route";
import { CREDIT_ACTIONS, creditCost, getBalance } from "../credits";
import { getSiteStore } from "../store";
import { assistantAiReady, getAssistantResponder, MockAssistantResponder } from "./ai";
import { assistantSystemPrompt, businessFacts } from "./prompt";
import {
  creditsForMessages,
  dailyConversationCap,
  LEAD_PREFIX,
  remainingMessages,
  toModelTurns,
  verifiedLead,
} from "./rules";
import { chatWithAssistant, resetAssistantLimiters } from "./service";
import { getAssistantStore, MemoryAssistantStore } from "./store";

const BROWSER =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

// Sem Supabase nos testes: sites, créditos e conversas ficam na memória. Sem Stripe nem
// REQUIRE_PLAN, todo dono tem os recursos dos planos (ownerHasFeature).

describe("assistant billing rule", () => {
  it("charges 1 credit per conversation and 1 more every 10 visitor messages", () => {
    expect(creditsForMessages(0)).toBe(0);
    expect(creditsForMessages(1)).toBe(1);
    expect(creditsForMessages(10)).toBe(1);
    expect(creditsForMessages(11)).toBe(2);
    expect(creditsForMessages(20)).toBe(2);
    expect(creditsForMessages(21)).toBe(3);
    expect(creditsForMessages(30)).toBe(3);
    expect(remainingMessages(28)).toBe(ASSISTANT_MAX_MESSAGES - 28);
    expect(remainingMessages(40)).toBe(0);
  });

  it("is listed in the credit prices with a cost of 1", () => {
    expect(CREDIT_ACTIONS).toContain("assistant_chat");
    expect(creditCost("assistant_chat")).toBe(1);
  });

  it("reads the per-site daily cap from the environment", () => {
    expect(dailyConversationCap({})).toBe(200);
    expect(dailyConversationCap({ ASSISTANT_DAILY_CONVERSATIONS_PER_SITE: "5" })).toBe(5);
    expect(dailyConversationCap({ ASSISTANT_DAILY_CONVERSATIONS_PER_SITE: "abc" })).toBe(200);
  });
});

describe("leads from the chat", () => {
  const typed = ["Hi, I'm Ana Souza", "call me at (512) 555-0199 or ana@example.com"];

  it("keeps only the contact details the visitor typed", () => {
    const lead = verifiedLead(
      { name: "Ana Souza", phone: "512-555-0199", email: "Ana@Example.com", message: "Balayage" },
      typed,
    );
    expect(lead).toEqual({
      name: "Ana Souza",
      phone: "512-555-0199",
      email: "ana@example.com",
      message: `${LEAD_PREFIX}\n\nBalayage`,
    });
  });

  it("drops invented contact details", () => {
    expect(
      verifiedLead({ name: "Ana", phone: "305-555-1111", message: "Cut" }, ["I want a cut"]),
    ).toBeNull();
    expect(verifiedLead({ name: "Ana", email: "x@y.com", message: "Cut" }, typed)).toBeNull();
    expect(verifiedLead(undefined, typed)).toBeNull();
  });

  it("does not trust a name the visitor never typed", () => {
    const lead = verifiedLead({ name: "John", phone: "5125550199", message: "Hi" }, typed);
    expect(lead?.name).toBe("Website visitor");
    expect(lead?.email).toBeNull();
  });
});

describe("assistant prompt", () => {
  const spec = fixtures["glow-salon"];

  it("is built only from the published site and keeps the owner's prices", () => {
    const facts = businessFacts({ spec, bookingAvailable: false });
    expect(facts).toContain("Glow Salon");
    expect(facts).toContain("(305) 555-0187");
    expect(facts).toContain("price: from $85");
    expect(facts).toContain("Online booking: not available.");
    // Depoimentos ficam de fora (o atendente não cita avaliações).
    expect(facts).not.toContain("day three");
  });

  it("tells the model to never invent and to treat the visitor as untrusted", () => {
    const prompt = assistantSystemPrompt({ spec, bookingAvailable: true });
    expect(prompt).toMatch(/Never invent or guess prices/);
    expect(prompt).toMatch(/untrusted/);
    expect(prompt).toMatch(/"offerBooking" to true/);
  });

  it("sends the conversation as alternating turns that end with the visitor", () => {
    expect(
      toModelTurns([
        { role: "assistant", text: "Hello" },
        { role: "visitor", text: "a" },
        { role: "visitor", text: "b" },
        { role: "assistant", text: "c" },
      ]),
    ).toEqual([{ role: "user", content: "a\n\nb" }]);
  });
});

describe("assistant provider", () => {
  it("uses the mock in development and nothing for real visitors without AI", () => {
    expect(assistantAiReady("mock", {})).toBe(true);
    expect(getAssistantResponder("mock", {})).toBeInstanceOf(MockAssistantResponder);
    expect(getAssistantResponder("mock", { VERCEL_ENV: "production" })).toBeNull();
    expect(getAssistantResponder("anthropic", {})).toBeNull();
    expect(assistantAiReady("anthropic", { ANTHROPIC_API_KEY: "sk-test" })).toBe(true);
  });
});

// ---------- Rota pública (o widget) ----------

let previousAllowance: string | undefined;

beforeEach(() => {
  new MemoryAssistantStore().clear();
  resetAssistantLimiters();
  previousAllowance = process.env.CREDITS_MONTHLY_NO_PLAN;
  process.env.CREDITS_MONTHLY_NO_PLAN = "5";
});

afterEach(() => {
  if (previousAllowance === undefined) delete process.env.CREDITS_MONTHLY_NO_PLAN;
  else process.env.CREDITS_MONTHLY_NO_PLAN = previousAllowance;
});

async function newSite(options: { enabled?: boolean; published?: boolean } = {}) {
  const ownerId = crypto.randomUUID();
  const site = await getSiteStore().create(fixtures["glow-salon"], ownerId);
  if (options.published ?? true) await getSiteStore().updateMeta(site.id, { status: "published" });
  if (options.enabled ?? true) await getAssistantStore().setEnabled(site.id, true);
  return { siteId: site.id, ownerId };
}

let visitor = 0;
function chat(
  siteId: string,
  body: Record<string, unknown>,
  { userAgent = BROWSER, ip }: { userAgent?: string | null; ip?: string } = {},
) {
  visitor++;
  return chatRoute(
    new Request(`http://localhost:3000/api/public/sites/${siteId}/assistant`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip ?? `198.51.100.${visitor % 250}`,
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: siteId }) },
  );
}

async function reply(res: Response) {
  return AssistantChatResponse.parse(await res.json());
}

const creditsUsed = async (ownerId: string) => (await getBalance({ id: ownerId })).monthlyUsed;

describe("POST /api/public/sites/[id]/assistant", () => {
  it("answers a visitor and charges the owner 1 credit for the first block of 10", async () => {
    const { siteId, ownerId } = await newSite();
    const ip = "203.0.113.10";
    const first = await reply(await chat(siteId, { message: "What are your hours?" }, { ip }));
    expect(first.reply.length).toBeGreaterThan(0);
    expect(first.remainingMessages).toBe(ASSISTANT_MAX_MESSAGES - 1);
    expect(await creditsUsed(ownerId)).toBe(1);

    for (let i = 2; i <= 10; i++) {
      await chat(
        siteId,
        { conversationId: first.conversationId, message: `Question ${i}` },
        { ip },
      );
    }
    expect(await creditsUsed(ownerId)).toBe(1);
    // A 11ª mensagem abre o segundo bloco.
    await chat(siteId, { conversationId: first.conversationId, message: "One more" }, { ip });
    expect(await creditsUsed(ownerId)).toBe(2);

    const [conversation] = await getAssistantStore().listConversations(siteId, 30);
    expect(conversation).toMatchObject({ visitorMessages: 11, creditsCharged: 2 });
    expect(await getSiteStore().countAiUsage(ownerId, "assistant_chat", "1970-01-01")).toBe(2);
  });

  it("starts a new paid conversation when the visitor opens the chat again", async () => {
    const { siteId, ownerId } = await newSite();
    await chat(siteId, { message: "Hi" });
    await chat(siteId, { message: "Hi again" });
    expect(await creditsUsed(ownerId)).toBe(2);
  });

  it("saves the visitor's contact details as a lead, once", async () => {
    const { siteId } = await newSite();
    const first = await reply(await chat(siteId, { message: "Hi, I need a cut" }));
    expect(first.leadSaved).toBe(false);
    const second = await reply(
      await chat(siteId, {
        conversationId: first.conversationId,
        message: "My number is (305) 555-0142",
      }),
    );
    expect(second.leadSaved).toBe(true);
    await chat(siteId, { conversationId: first.conversationId, message: "Thanks, 305 555 0142" });
    const leads = await getSiteStore().listLeads(siteId);
    expect(leads).toHaveLength(1);
    expect(leads[0]?.phone).toBe("(305) 555-0142");
    expect(leads[0]?.message.startsWith(LEAD_PREFIX)).toBe(true);
  });

  it("ends the conversation after the message cap", async () => {
    const { siteId } = await newSite();
    process.env.CREDITS_MONTHLY_NO_PLAN = "100";
    const ip = "203.0.113.20";
    const first = await reply(await chat(siteId, { message: "Question 1" }, { ip }));
    let last = first;
    for (let i = 2; i <= ASSISTANT_MAX_MESSAGES; i++) {
      last = await reply(
        await chat(
          siteId,
          { conversationId: first.conversationId, message: `Question ${i}` },
          { ip },
        ),
      );
    }
    expect(last.ended).toBe(true);
    expect(last.remainingMessages).toBe(0);
    const over = await reply(
      await chat(siteId, { conversationId: first.conversationId, message: "more" }, { ip }),
    );
    expect(over.ended).toBe(true);
    expect(over.reply).toMatch(/reached its limit/);
  });

  it("answers politely and stops when the owner is out of credits", async () => {
    process.env.CREDITS_MONTHLY_NO_PLAN = "0";
    const { siteId, ownerId } = await newSite();
    const res = await reply(await chat(siteId, { message: "Hello?" }));
    expect(res.ended).toBe(true);
    expect(res.reply).toMatch(/contact form/);
    expect(await creditsUsed(ownerId)).toBe(0);
    const [conversation] = await getAssistantStore().listConversations(siteId, 30);
    expect(conversation?.creditsCharged).toBe(0);
  });

  it("refunds the owner when the AI fails", async () => {
    const { siteId, ownerId } = await newSite();
    const site = await getSiteStore().get(siteId);
    if (!site) throw new Error("site missing");
    const outcome = await chatWithAssistant({
      site,
      message: "Hi",
      ipHash: null,
      ipKey: "test",
      requestUrl: "http://localhost:3000/",
      responder: {
        reply: async () => {
          throw new Error("down");
        },
      },
    });
    expect(outcome.ok).toBe(false);
    expect(await creditsUsed(ownerId)).toBe(0);
    const [conversation] = await getAssistantStore().listConversations(siteId, 30);
    expect(conversation?.creditsCharged).toBe(0);
  });

  it("is not available when the owner turned it off or the site is offline", async () => {
    const off = await newSite({ enabled: false });
    expect((await chat(off.siteId, { message: "Hi" })).status).toBe(404);
    const draft = await newSite({ published: false });
    expect((await chat(draft.siteId, { message: "Hi" })).status).toBe(404);
  });

  it("only continues a conversation on the site it belongs to", async () => {
    const a = await newSite();
    const b = await newSite();
    const first = await reply(await chat(a.siteId, { message: "Hi" }));
    const res = await chat(b.siteId, { conversationId: first.conversationId, message: "Hi" });
    expect(res.status).toBe(404);
  });

  it("refuses bots, the honeypot and long messages", async () => {
    const { siteId } = await newSite();
    expect((await chat(siteId, { message: "Hi" }, { userAgent: "curl/8.0" })).status).toBe(403);
    expect((await chat(siteId, { message: "Hi", company: "Acme" })).status).toBe(403);
    const long = await chat(siteId, { message: "x".repeat(501) });
    expect(long.status).toBe(400);
    expect(ApiError.parse(await long.json()).error.code).toBe("invalid_request");
  });

  it("limits new conversations per network", async () => {
    const { siteId } = await newSite();
    process.env.CREDITS_MONTHLY_NO_PLAN = "100";
    const ip = "203.0.113.30";
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++)
      statuses.push((await chat(siteId, { message: "Hi" }, { ip })).status);
    expect(statuses.slice(0, 6).every((status) => status === 200)).toBe(true);
    expect(statuses[6]).toBe(429);
  });
});
