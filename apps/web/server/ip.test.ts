import { describe, expect, it } from "vitest";
import { ipBucket, requestIpHash } from "./ip";

describe("ipBucket", () => {
  it("keeps IPv4 addresses whole", () => {
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("groups IPv6 addresses by their /64 prefix", () => {
    const a = ipBucket("2001:db8:abcd:12::1");
    expect(a).toBe("2001:0db8:abcd:0012::/64");
    expect(ipBucket("2001:db8:abcd:12:ffff:1:2:3")).toBe(a);
    expect(ipBucket("2001:db8:abcd:13::1")).not.toBe(a);
  });

  it("ignores anything that is not an IP", () => {
    expect(ipBucket("not-an-ip")).toBeNull();
    expect(ipBucket("")).toBeNull();
  });
});

describe("requestIpHash", () => {
  it("hashes the visitor IP and never returns it", async () => {
    const hash = await requestIpHash(new Headers({ "x-real-ip": "203.0.113.7" }));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203");
    expect(await requestIpHash(new Headers())).toBeNull();
  });
});
