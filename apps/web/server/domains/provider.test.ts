import { describe, expect, it, vi } from "vitest";

const ns = vi.hoisted(() => ({ records: [] as string[], fail: false }));
vi.mock("node:dns/promises", () => ({
  resolveNs: async () => {
    if (ns.fail) throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    return ns.records;
  },
}));

const { detectDnsProvider, providerFromNameserver } = await import("./provider");

describe("DNS provider detection", () => {
  it("recognizes the big domain companies by their nameservers", () => {
    expect(providerFromNameserver("ns51.domaincontrol.com")).toBe("godaddy");
    expect(providerFromNameserver("dns1.registrar-servers.com.")).toBe("namecheap");
    expect(providerFromNameserver("kai.ns.cloudflare.com")).toBe("cloudflare");
    expect(providerFromNameserver("ns-cloud-a1.googledomains.com")).toBe("squarespace");
    expect(providerFromNameserver("ns1.dns-parking.com")).toBe("hostinger");
    expect(providerFromNameserver("curitiba.ns.porkbun.com")).toBe("porkbun");
    expect(providerFromNameserver("ns1045.ui-dns.com")).toBe("ionos");
    expect(providerFromNameserver("ns12.wixdns.net")).toBe("wix");
    expect(providerFromNameserver("ns1.example-host.net")).toBeNull();
  });

  it("returns null when the lookup fails or nothing matches", async () => {
    ns.fail = false;
    ns.records = ["ns1.unknown.net", "ns52.domaincontrol.com"];
    expect(await detectDnsProvider("joes.com")).toBe("godaddy");
    ns.records = ["ns1.unknown.net"];
    expect(await detectDnsProvider("joes.com")).toBeNull();
    ns.fail = true;
    expect(await detectDnsProvider("joes.com")).toBeNull();
  });
});
