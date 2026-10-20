import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryGrantStore, type AccessGrant } from "./grants";
import { reminderDue, reminderStageFor, sendAccessReminders, type ReminderDeps } from "./reminders";

const NOW = new Date("2026-10-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const USER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";

function grant(inDays: number, overrides: Partial<AccessGrant> = {}): AccessGrant {
  return {
    userId: USER,
    plan: "pro",
    expiresAt: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: new Date(NOW.getTime() - 300 * DAY).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  (globalThis as { __nosweatGrants?: unknown }).__nosweatGrants = undefined;
});

describe("access reminder stages", () => {
  it("picks 7 days, 1 day and ended, and nothing far away or long ago", () => {
    expect(reminderStageFor(grant(20), NOW)).toBeNull();
    expect(reminderStageFor(grant(6.5), NOW)).toBe("7d");
    expect(reminderStageFor(grant(0.5), NOW)).toBe("1d");
    expect(reminderStageFor(grant(-0.5), NOW)).toBe("ended");
    expect(reminderStageFor(grant(-10), NOW)).toBeNull();
  });

  it("does not tell a revoked account to renew", () => {
    const revokedAt = new Date(NOW.getTime() - DAY).toISOString();
    expect(reminderStageFor(grant(-1, { updatedAt: revokedAt }), NOW)).toBeNull();
  });

  it("sends each stage once for the same end date, and starts over when the date changes", () => {
    const base = grant(0.5);
    expect(reminderDue({ ...base, reminderStage: "7d", remindedFor: base.expiresAt }, NOW)).toBe(
      "1d",
    );
    expect(
      reminderDue({ ...base, reminderStage: "1d", remindedFor: base.expiresAt }, NOW),
    ).toBeNull();
    // Postgres devolve "+00:00": é o mesmo instante.
    const pgDate = base.expiresAt.replace("Z", "+00:00");
    expect(reminderDue({ ...base, reminderStage: "1d", remindedFor: pgDate }, NOW)).toBeNull();
    const renewed = grant(5, { reminderStage: "ended", remindedFor: base.expiresAt });
    expect(reminderDue(renewed, NOW)).toBe("7d");
  });
});

describe("sendAccessReminders", () => {
  function deps(overrides: Partial<ReminderDeps> = {}) {
    const store = new MemoryGrantStore();
    const send = vi.fn<ReminderDeps["send"]>(async () => "sent");
    const value: ReminderDeps = {
      store,
      getAccount: async () => ({ email: "owner@joesplumbing.com", testAccount: false }),
      send,
      enforced: true,
      env: { RESEND_API_KEY: "re_test", APP_URL: "https://nosweatfd.com/" },
      ...overrides,
    };
    return { store, send, value };
  }

  it("does nothing while plans or e-mail are off", async () => {
    const off = deps({ enforced: false });
    expect((await sendAccessReminders(NOW, off.value)).disabled).toBe("billing_off");
    const noKey = deps({ env: {} });
    expect((await sendAccessReminders(NOW, noKey.value)).disabled).toBe("email_off");
    expect(noKey.send).not.toHaveBeenCalled();
  });

  it("emails the customer once per stage and sends one digest to sales", async () => {
    const { store, send, value } = deps();
    await store.upsert(grant(3));

    const first = await sendAccessReminders(NOW, value);
    expect(first).toMatchObject({ sent: 1, failed: 0, digest: "sent" });
    expect(send).toHaveBeenCalledTimes(2);
    const [to, subject, text] = send.mock.calls[0] ?? [];
    expect(to).toBe("owner@joesplumbing.com");
    expect(subject).toMatch(/Pro plan ends on/);
    expect(text).toContain("https://nosweatfd.com/billing");
    expect(send.mock.calls[1]?.[0]).toBe("hello@nosweatfd.com");
    expect((await store.get(USER))?.reminderStage).toBe("7d");

    send.mockClear();
    const second = await sendAccessReminders(NOW, value);
    expect(second).toMatchObject({ sent: 0, digest: "none" });
    expect(send).not.toHaveBeenCalled();
  });

  it("skips test accounts and retries tomorrow when the e-mail fails", async () => {
    const test = deps({
      getAccount: async () => ({ email: "test+a@nosweatfd.com", testAccount: true }),
    });
    await test.store.upsert(grant(3));
    expect(await sendAccessReminders(NOW, test.value)).toMatchObject({ skipped: 1, sent: 0 });

    const failing = deps({ send: vi.fn<ReminderDeps["send"]>(async () => "failed") });
    await failing.store.upsert(grant(3));
    expect(await sendAccessReminders(NOW, failing.value)).toMatchObject({ failed: 1 });
    expect((await failing.store.get(USER))?.reminderStage).toBeNull();
  });
});
