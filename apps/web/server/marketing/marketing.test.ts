import { describe, expect, it, vi } from "vitest";
import { joinLaunchList, marketingFromMetadata, MemoryContactStore } from ".";
import { isValidUnsubscribeToken, unsubscribeToken } from "./unsubscribe-link";
import { buildWelcomeEmail } from "./welcome-email";

const env = {
  RESEND_API_KEY: "re_test",
  MARKETING_POSTAL_ADDRESS: "123 Main St, Austin, TX 78701",
};
const input = {
  userId: "u1",
  email: "Maria@Example.com",
  firstName: "Maria",
  optedIn: true,
  origin: "https://nosweatfd.com",
};

function okFetch() {
  return vi.fn(async () => new Response("{}", { status: 200 }));
}

describe("unsubscribe token", () => {
  it("vale para o mesmo e-mail (sem diferenciar maiúsculas) e não para outro", () => {
    const token = unsubscribeToken("maria@example.com", "s");
    expect(isValidUnsubscribeToken("MARIA@example.com", token, "s")).toBe(true);
    expect(isValidUnsubscribeToken("other@example.com", token, "s")).toBe(false);
    expect(isValidUnsubscribeToken("maria@example.com", "x", "s")).toBe(false);
  });
});

describe("buildWelcomeEmail", () => {
  it("tem link para sair, cabeçalho de um clique e endereço postal", () => {
    const email = buildWelcomeEmail(input, env.MARKETING_POSTAL_ADDRESS);
    expect(email.text).toContain(
      "https://nosweatfd.com/unsubscribe?email=maria%40example.com&token=",
    );
    expect(email.html).toContain(">Unsubscribe</a>");
    expect(email.text).toContain("123 Main St, Austin, TX 78701");
    expect(email.headers["List-Unsubscribe"]).toContain("/api/unsubscribe?email=");
    expect(email.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});

describe("joinLaunchList", () => {
  it("adiciona quem marcou a caixa e manda o e-mail uma vez só", async () => {
    const store = new MemoryContactStore();
    const fetchImpl = okFetch();
    expect(await joinLaunchList(input, store, env, fetchImpl)).toBe("added");
    expect(await joinLaunchList(input, store, env, fetchImpl)).toBe("already_listed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(store.rows.get("maria@example.com")?.welcomeSentAt).not.toBeNull();
  });

  it("ignora quem não marcou a caixa", async () => {
    const fetchImpl = okFetch();
    expect(
      await joinLaunchList({ ...input, optedIn: false }, new MemoryContactStore(), env, fetchImpl),
    ).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("não envia sem endereço postal (CAN-SPAM), mas guarda o contato", async () => {
    const store = new MemoryContactStore();
    const fetchImpl = okFetch();
    expect(await joinLaunchList(input, store, { RESEND_API_KEY: "re_test" }, fetchImpl)).toBe(
      "added",
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(store.rows.get("maria@example.com")?.welcomeSentAt).toBeNull();
  });

  it("quem saiu da lista não volta a receber", async () => {
    const store = new MemoryContactStore();
    await store.unsubscribe("maria@example.com");
    const fetchImpl = okFetch();
    expect(await joinLaunchList(input, store, env, fetchImpl)).toBe("already_listed");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await store.isUnsubscribed("MARIA@example.com")).toBe(true);
  });
});

describe("marketingFromMetadata", () => {
  it("lê o opt-in e o primeiro nome", () => {
    expect(marketingFromMetadata({ marketing_opt_in: true, first_name: "Ana" })).toEqual({
      optedIn: true,
      firstName: "Ana",
    });
    expect(marketingFromMetadata(undefined)).toEqual({ optedIn: false, firstName: null });
  });
});
