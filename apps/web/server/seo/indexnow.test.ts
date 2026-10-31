import { afterEach, describe, expect, it, vi } from "vitest";
import { INDEXNOW_KEY, INDEXNOW_KEY_PATH, isNotifiableUrl, notifyIndexNow } from "./indexnow";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("isNotifiableUrl", () => {
  it("accepts public https addresses only", () => {
    expect(isNotifiableUrl("https://www.nosweatfd.com/s/joes-plumbing")).toBe(true);
    expect(isNotifiableUrl("https://joesplumbing.com")).toBe(true);
    expect(isNotifiableUrl("http://joesplumbing.com")).toBe(false);
    expect(isNotifiableUrl("http://localhost:3000/s/joe")).toBe(false);
    expect(isNotifiableUrl("https://no-sweat-git-x.vercel.app/s/joe")).toBe(false);
    expect(isNotifiableUrl("not a url")).toBe(false);
  });
});

describe("notifyIndexNow", () => {
  it("does not call anyone outside production", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ENV", "preview");
    const [result] = await notifyIndexNow(["https://www.nosweatfd.com/s/joe"]);
    expect(result?.status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends one request per host with the key location on that host", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ENV", "production");
    const results = await notifyIndexNow([
      "https://www.nosweatfd.com/s/joe",
      "https://joesplumbing.com",
    ]);
    expect(results.map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const body = JSON.parse(String(calls[1]?.[1].body));
    expect(body).toEqual({
      host: "joesplumbing.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://joesplumbing.com${INDEXNOW_KEY_PATH}`,
      urlList: ["https://joesplumbing.com"],
    });
  });

  it("reports a refusal or a network error without throwing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 403 })),
    );
    expect((await notifyIndexNow(["https://joesplumbing.com"]))[0]?.status).toBe("failed");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect((await notifyIndexNow(["https://joesplumbing.com"]))[0]?.reason).toBe("network");
  });
});
