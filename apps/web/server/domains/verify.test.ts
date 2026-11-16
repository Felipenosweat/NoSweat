import { describe, expect, it, vi } from "vitest";

const txt = vi.hoisted(() => ({ records: [] as string[][], fail: false }));
vi.mock("node:dns/promises", () => ({
  resolveTxt: async () => {
    if (txt.fail) throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    return txt.records;
  },
}));

const { isDomainVerified, verificationRecord, verificationToken } = await import("./verify");
const { deriveSecret } = await import("../secret");
const acceptedSecretFor = (master: string) => deriveSecret(master, "domain-verify");

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

  it("keeps accepting a code shown before a secret rotation (old Supabase-key code too)", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    vi.stubEnv("NOSWEAT_SECRET_DOMAIN_VERIFY", "");
    vi.stubEnv("NOSWEAT_SECRET", "");
    const oldValue = verificationRecord("owner-a", "joes.com").value;
    vi.stubEnv("NOSWEAT_SECRET", "new-master");
    const newValue = verificationRecord("owner-a", "joes.com").value;
    // A tela mostra o código do segredo novo; o TXT antigo continua valendo.
    expect(newValue).not.toBe(oldValue);
    expect(newValue).toBe(
      `nosweat-verify=${verificationToken("owner-a", "joes.com", acceptedSecretFor("new-master"))}`,
    );
    txt.fail = false;
    txt.records = [[oldValue]];
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(true);
    txt.records = [[newValue]];
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(true);
    // Com o segredo antigo desligado, só o código novo vale.
    vi.stubEnv("NOSWEAT_SECRET_LEGACY", "off");
    txt.records = [[oldValue]];
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(false);
    vi.unstubAllEnvs();
  });

  it("treats DNS errors as not verified yet", async () => {
    txt.fail = true;
    expect(await isDomainVerified("owner-a", "joes.com")).toBe(false);
  });
});
