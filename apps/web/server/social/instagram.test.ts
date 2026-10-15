import { describe, expect, it } from "vitest";
import { InstagramError } from "./client";
import { LiveInstagramClient, mapGraphError, redactSecrets } from "./instagram";
import { MockInstagramClient } from "./instagram-mock";

const config = {
  appId: "app-123",
  appSecret: "secret-abcdef",
  redirectUri: "https://nosweatfd.com/api/social/instagram/callback",
  graphVersion: "v26.0",
};
const TOKEN = "IGAAtokenvalue123456";

type Call = { url: string; init: RequestInit | undefined };

function stubFetch(responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  };
  return { calls, client: new LiveInstagramClient(config, fetchImpl) };
}

const json = (body: unknown, status = 200) => Response.json(body, { status });
const graphError = (code: number, subcode?: number, status = 400) =>
  json(
    {
      error: {
        message: `boom access_token=${TOKEN}`,
        type: "OAuthException",
        code,
        error_subcode: subcode,
      },
    },
    status,
  );

describe("mapGraphError", () => {
  const cases: { status: number; code: number; subcode?: number; kind: string }[] = [
    { status: 400, code: 190, kind: "auth" },
    { status: 400, code: 100, subcode: 463, kind: "auth" },
    { status: 400, code: 4, kind: "rate_limit" },
    { status: 400, code: 17, kind: "rate_limit" },
    { status: 400, code: 9, subcode: 2207042, kind: "rate_limit" },
    { status: 400, code: 2, kind: "transient" },
    { status: 500, code: 100, kind: "transient" },
    { status: 400, code: 9004, subcode: 2207052, kind: "permanent" },
    { status: 400, code: 36003, kind: "permanent" },
    { status: 400, code: 100, subcode: 2207026, kind: "permanent" },
  ];
  it("maps Graph error codes to error kinds", () => {
    for (const { status, code, subcode, kind } of cases) {
      const error = mapGraphError(status, {
        error: { message: "x", code, error_subcode: subcode },
      });
      expect(error.kind, `code ${code}/${subcode ?? "-"}`).toBe(kind);
      expect(error.code).toBe(code);
    }
  });

  it("treats unknown bodies as permanent (4xx) or transient (5xx)", () => {
    expect(mapGraphError(400, "nope").kind).toBe("permanent");
    expect(mapGraphError(503, null).kind).toBe("transient");
  });

  it("redacts tokens", () => {
    expect(redactSecrets(`x?access_token=${TOKEN}&y=1`)).not.toContain(TOKEN);
    expect(redactSecrets(`token ${TOKEN}`, [TOKEN])).not.toContain(TOKEN);
  });
});

describe("LiveInstagramClient", () => {
  it("builds the authorize URL with both scopes and the state", () => {
    const { client } = stubFetch([]);
    const url = new URL(client.authorizeUrl("st4te"));
    expect(url.origin + url.pathname).toBe("https://www.instagram.com/oauth/authorize");
    expect(url.searchParams.get("scope")).toBe(
      "instagram_business_basic,instagram_business_content_publish",
    );
    expect(url.searchParams.get("state")).toBe("st4te");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(config.redirectUri);
  });

  it("exchanges the code for a long-lived token", async () => {
    const { client, calls } = stubFetch([
      json({
        data: [
          {
            access_token: "short",
            user_id: 9988,
            permissions: "instagram_business_basic,instagram_business_content_publish",
          },
        ],
      }),
      json({ access_token: TOKEN, token_type: "bearer", expires_in: 5_183_944 }),
    ]);
    const token = await client.exchangeCode("the-code");
    expect(token).toEqual({
      accessToken: TOKEN,
      expiresIn: 5_183_944,
      scopes: ["instagram_business_basic", "instagram_business_content_publish"],
      appScopedId: "9988",
    });
    expect(calls[0]?.url).toBe("https://api.instagram.com/oauth/access_token");
    expect(calls[0]?.init?.method).toBe("POST");
    const form = calls[0]?.init?.body as URLSearchParams;
    expect(form.get("grant_type")).toBe("authorization_code");
    expect(form.get("code")).toBe("the-code");
    expect(calls[1]?.url).toContain("grant_type=ig_exchange_token");
  });

  it("sends the token in the Authorization header, never in Graph URLs", async () => {
    const { client, calls } = stubFetch([
      json({ id: "app-scoped", user_id: "1784", username: "joe", account_type: "BUSINESS" }),
      json({ id: "c1" }),
      json({ id: "c2" }),
      json({ status_code: "FINISHED" }),
      json({ id: "m1" }),
      json({ id: "m1", permalink: "https://www.instagram.com/p/abc/" }),
      json({ data: [{ quota_usage: 3 }] }),
    ]);
    const profile = await client.getProfile(TOKEN);
    expect(profile).toEqual({
      id: "1784",
      username: "joe",
      accountType: "BUSINESS",
      avatarUrl: null,
    });
    await client.createImageContainer(TOKEN, "1784", {
      imageUrl: "https://x.supabase.co/a.jpg",
      isCarouselItem: true,
    });
    await client.createCarouselContainer(TOKEN, "1784", { children: ["c1", "c9"], caption: "Hi" });
    expect(await client.getContainerStatus(TOKEN, "c2")).toBe("FINISHED");
    expect(await client.publish(TOKEN, "1784", "c2")).toBe("m1");
    expect((await client.getMedia(TOKEN, "m1")).permalink).toBe("https://www.instagram.com/p/abc/");
    expect(await client.getPublishingUsage(TOKEN, "1784")).toBe(3);

    for (const call of calls) {
      expect(call.url).not.toContain(TOKEN);
      expect(call.url.startsWith("https://graph.instagram.com/v26.0/")).toBe(true);
      expect(new Headers(call.init?.headers).get("authorization")).toBe(`Bearer ${TOKEN}`);
    }
    const carousel = calls[2]?.init?.body as URLSearchParams;
    expect(carousel.get("media_type")).toBe("CAROUSEL");
    expect(carousel.get("children")).toBe("c1,c9");
    const item = calls[1]?.init?.body as URLSearchParams;
    expect(item.get("is_carousel_item")).toBe("true");
    expect(item.get("caption")).toBeNull();
    expect(calls[4]?.url).toBe("https://graph.instagram.com/v26.0/1784/media_publish");
    expect((calls[4]?.init?.body as URLSearchParams).get("creation_id")).toBe("c2");
  });

  it("maps HTTP errors and network failures without leaking the token", async () => {
    const { client } = stubFetch([
      graphError(190, 460, 401),
      graphError(9004, 2207052),
      new TypeError("fetch failed"),
      json({ unexpected: true }),
    ]);
    const kinds: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      try {
        await client.publish(TOKEN, "1784", "c1");
      } catch (error) {
        expect(error).toBeInstanceOf(InstagramError);
        expect((error as InstagramError).message).not.toContain(TOKEN);
        kinds.push((error as InstagramError).kind);
      }
    }
    expect(kinds).toEqual(["auth", "permanent", "transient", "transient"]);
  });
});

describe("MockInstagramClient", () => {
  it("is deterministic and can be told to fail", async () => {
    const mock = new MockInstagramClient();
    expect(mock.authorizeUrl("s")).toBe("/api/social/instagram/callback?code=mock&state=s");
    const token = await mock.exchangeCode("mock");
    expect(token.scopes).toContain("instagram_business_content_publish");
    expect(token.expiresIn).toBe(60 * 24 * 60 * 60);
    const profile = await mock.getProfile(token.accessToken);
    expect(profile.username).toBe("nosweat_demo");
    const container = await mock.createImageContainer(token.accessToken, profile.id, {
      imageUrl: "https://x/a.jpg",
    });
    expect(await mock.getContainerStatus(token.accessToken, container)).toBe("FINISHED");
    mock.failNext("publish", new InstagramError("limit", "rate_limit"));
    await expect(mock.publish(token.accessToken, profile.id, container)).rejects.toMatchObject({
      kind: "rate_limit",
    });
    const mediaId = await mock.publish(token.accessToken, profile.id, container);
    expect((await mock.getMedia(token.accessToken, mediaId)).permalink).toBe(
      `https://www.instagram.com/p/mock${mediaId}/`,
    );
  });
});
