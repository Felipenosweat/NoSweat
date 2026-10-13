import { describe, expect, it, vi } from "vitest";

const txt = vi.hoisted(() => ({ records: [] as string[][], fail: false }));
vi.mock("node:dns/promises", () => ({
  resolveTxt: async () => {
    if (txt.fail) throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    return txt.records;
  },
}));

const { isDomainVerified, verificationRecord, verificationToken } = await import("./verify");

describe("domain ownership verification", () => {
  it("gives each owner a different code for the same domain", () => {
    expect(verificationToken("owner-a", "joes.com")).not.toBe(
      verificationToken("owner-b", "joes.com"),
    );
    expect(verificationRecord("owner-a", "joes.com")).toMatchObject({
      type: "TXT",
      name: "_nosweat",
    });
  });

  it("accepts only the owner's code (TXT values may come split in chunks)", async () => {
    const value = verificationRecord("owner-a", "joes.com").value;
    txt.fail = false;
    txt.records = [["v=spf1 -all"], [value.slice(0, 10), value.slice(10)]];
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(true);
    expect(await isDomainVerified("owner-b", "joes.com")).toBe(false);
  });

  it("treats DNS errors as not verified yet", async () => {
    txt.fail = true;
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(false);
  });
});
