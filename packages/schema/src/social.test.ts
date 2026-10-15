import { describe, expect, it } from "vitest";
import {
  ApproveSocialPostsRequest,
  CreateSocialPostRequest,
  PlanMonthRequest,
  SocialAccount,
  SocialPlan,
} from "./index";

const media = {
  path: "owner/abc.jpg",
  url: "https://example.supabase.co/storage/v1/object/public/social-media/owner/abc.jpg",
  width: 1080,
  height: 1350,
  mime: "image/jpeg" as const,
};

describe("social schema", () => {
  it("never lets the access token reach the browser", () => {
    const parsed = SocialAccount.parse({
      id: "a1",
      provider: "instagram",
      username: "joescleaning",
      avatarUrl: null,
      accountType: "BUSINESS",
      status: "active",
      tokenExpiresAt: null,
      connectedAt: "2026-10-15T12:00:00.000Z",
      accessToken: "IGQ-secret",
    });
    expect(parsed).not.toHaveProperty("accessToken");
  });

  it("enforces Instagram limits on captions and photos", () => {
    expect(CreateSocialPostRequest.safeParse({ caption: "x".repeat(2201) }).success).toBe(false);
    expect(
      CreateSocialPostRequest.safeParse({ media: Array.from({ length: 11 }, () => media) }).success,
    ).toBe(false);
    expect(CreateSocialPostRequest.parse({ media: [media] })).toMatchObject({ caption: "" });
    expect(
      CreateSocialPostRequest.safeParse({ media: [{ ...media, mime: "image/png" }] }).success,
    ).toBe(false);
  });

  it("validates the AI month request and plan", () => {
    expect(PlanMonthRequest.safeParse({ month: "2026-11", postsPerWeek: 3 }).success).toBe(true);
    expect(PlanMonthRequest.safeParse({ month: "2026-13", postsPerWeek: 3 }).success).toBe(false);
    expect(PlanMonthRequest.safeParse({ month: "2026-11", postsPerWeek: 4 }).success).toBe(false);
    const item = {
      date: "2026-11-03",
      time: "10:00",
      pillar: "tip",
      caption: "Quick tip for a cleaner kitchen.",
      hashtags: ["#cleaning"],
      ownerNotePt: "Dica rápida de limpeza da cozinha.",
      photoIndex: null,
    };
    expect(SocialPlan.safeParse({ posts: [item] }).success).toBe(true);
    expect(SocialPlan.safeParse({ posts: [{ ...item, time: "25:00" }] }).success).toBe(false);
  });

  it("approves between 1 and 60 posts at a time", () => {
    expect(ApproveSocialPostsRequest.safeParse({ ids: [] }).success).toBe(false);
    expect(ApproveSocialPostsRequest.safeParse({ ids: ["a"] }).success).toBe(true);
    expect(
      ApproveSocialPostsRequest.safeParse({ ids: Array.from({ length: 61 }, (_, i) => `p${i}`) })
        .success,
    ).toBe(false);
  });
});
