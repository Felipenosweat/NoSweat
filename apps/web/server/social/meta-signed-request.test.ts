import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseSignedRequest } from "./meta-signed-request";

const SECRET = "meta-app-secret";

function sign(payload: Record<string, unknown>, secret = SECRET): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${sig}.${body}`;
}

describe("parseSignedRequest", () => {
  it("accepts a valid request", () => {
    const parsed = parseSignedRequest(
      sign({ algorithm: "HMAC-SHA256", user_id: "12345", issued_at: 1 }),
      SECRET,
    );
    expect(parsed?.user_id).toBe("12345");
  });

  it("turns numeric user ids into strings", () => {
    expect(
      parseSignedRequest(sign({ algorithm: "HMAC-SHA256", user_id: 42 }), SECRET)?.user_id,
    ).toBe("42");
  });

  it("rejects a wrong secret, tampering, a bad algorithm or garbage", () => {
    const valid = sign({ algorithm: "HMAC-SHA256", user_id: "1" });
    expect(
      parseSignedRequest(sign({ algorithm: "HMAC-SHA256", user_id: "1" }, "other"), SECRET),
    ).toBeNull();
    const [sig] = valid.split(".");
    const forged = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "2" })).toString(
      "base64url",
    );
    expect(parseSignedRequest(`${sig}.${forged}`, SECRET)).toBeNull();
    expect(parseSignedRequest(sign({ algorithm: "none", user_id: "1" }), SECRET)).toBeNull();
    expect(parseSignedRequest(sign({ algorithm: "HMAC-SHA256" }), SECRET)).toBeNull();
    expect(parseSignedRequest("garbage", SECRET)).toBeNull();
    expect(parseSignedRequest("", SECRET)).toBeNull();
    expect(parseSignedRequest(valid, "")).toBeNull();
  });
});
