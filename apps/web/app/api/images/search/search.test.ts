import { ApiError, ImageSearchResponse } from "@nosweat/schema";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const url = (query: string) => new Request(`http://localhost/api/images/search${query}`);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/images/search", () => {
  it("returns an empty list with 200 when no image provider is configured", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const res = await GET(url("?q=clean%20kitchen&orientation=landscape"));
    expect(res.status).toBe(200);
    expect(ImageSearchResponse.parse(await res.json())).toEqual({ results: [] });
  });

  it("rejects a missing or too short query", async () => {
    for (const query of ["", "?q=a", "?q=kitchen&orientation=sideways"]) {
      const res = await GET(url(query));
      expect(res.status).toBe(400);
      expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
    }
  });
});
