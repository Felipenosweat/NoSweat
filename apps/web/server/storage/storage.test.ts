import { ApiError, UploadImageResponse } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as uploadRoute } from "@/app/api/sites/[id]/images/route";
import { DEV_USER } from "@/server/auth/session";
import { getSiteStore } from "@/server/store";
import { MAX_IMAGE_BYTES, checkImageUpload, detectImageFormat, imagePath, uploadImage } from ".";

/** PNG mínimo: assinatura + cabeçalho IHDR com largura e altura. */
function png(width = 640, height = 480): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

/** JPEG mínimo: SOI + APP0 curto + SOF0 com altura e largura. */
function jpeg(width = 800, height = 600): Uint8Array {
  const bytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0, 0x03,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const view = new DataView(bytes.buffer);
  view.setUint16(13, height);
  view.setUint16(15, width);
  return bytes;
}

function webp(): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set(
    [..."RIFF"].map((c) => c.charCodeAt(0)),
    0,
  );
  bytes.set(
    [..."WEBPVP8X"].map((c) => c.charCodeAt(0)),
    8,
  );
  return bytes;
}

describe("image upload validation", () => {
  it("detects formats by magic bytes", () => {
    expect(detectImageFormat(png())?.mime).toBe("image/png");
    expect(detectImageFormat(jpeg())?.mime).toBe("image/jpeg");
    expect(detectImageFormat(webp())?.mime).toBe("image/webp");
    expect(detectImageFormat(new TextEncoder().encode("<svg></svg>"))).toBeNull();
  });

  it("accepts a real PNG and JPEG and reads their size", () => {
    expect(checkImageUpload("image/png", png(640, 480))).toMatchObject({
      ok: true,
      width: 640,
      height: 480,
      format: { ext: "png" },
    });
    expect(checkImageUpload("image/jpeg", jpeg(800, 600))).toMatchObject({
      ok: true,
      width: 800,
      height: 600,
      format: { ext: "jpg" },
    });
  });

  it("rejects other types, mismatched content and empty files", () => {
    expect(checkImageUpload("image/gif", png())).toMatchObject({ ok: false, status: 400 });
    expect(checkImageUpload("image/png", jpeg())).toMatchObject({ ok: false, status: 400 });
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect(checkImageUpload("image/jpeg", html)).toMatchObject({ ok: false, status: 400 });
    expect(checkImageUpload("image/png", new Uint8Array())).toMatchObject({ ok: false });
  });

  it("rejects files over 4 MB", () => {
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(png());
    expect(checkImageUpload("image/png", big)).toMatchObject({ ok: false, status: 413 });
  });

  it("stores files under the site id with a random name", () => {
    const path = imagePath("site-1", { mime: "image/png", ext: "png" });
    expect(path).toMatch(/^site-1\/[0-9a-f]{32}\.png$/);
    expect(imagePath("site-1", { mime: "image/png", ext: "png" })).not.toBe(path);
  });

  it("uploads to the Storage REST API with the service key", async () => {
    const fetchMock = vi.fn(async () => Response.json({ Key: "site-images/x" }));
    const config = { url: "https://abc.supabase.co", serviceKey: "secret" };
    const url = await uploadImage(
      config,
      "s1/a.png",
      png(),
      { mime: "image/png", ext: "png" },
      fetchMock as unknown as typeof fetch,
    );
    expect(url).toBe("https://abc.supabase.co/storage/v1/object/public/site-images/s1/a.png");
    const [target, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(target).toBe("https://abc.supabase.co/storage/v1/object/site-images/s1/a.png");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("image/png");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");
  });

  it("raises when Storage refuses the file", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 400 }));
    await expect(
      uploadImage(
        { url: "https://abc.supabase.co", serviceKey: "k" },
        "s1/a.png",
        png(),
        { mime: "image/png", ext: "png" },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/400/);
  });
});

describe("POST /api/sites/[id]/images", () => {
  // Cria o store em memória ANTES de mexer nas variáveis do Supabase.
  const store = getSiteStore();
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  function uploadRequest(bytes: Uint8Array, type: string, alt?: string): Request {
    const form = new FormData();
    form.set("file", new File([bytes as BlobPart], "photo", { type }));
    if (alt !== undefined) form.set("alt", alt);
    return new Request("http://localhost/api/sites/x/images", { method: "POST", body: form });
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers 501 when storage is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
    const res = await uploadRoute(uploadRequest(png(), "image/png"), ctx(site.id));
    expect(res.status).toBe(501);
    const body = ApiError.parse(await res.json());
    expect(body.error).toEqual({
      code: "not_implemented",
      message: "Photo uploads need storage to be configured.",
    });
  });

  it("returns 404 for someone else's site", async () => {
    const site = await store.create(fixtures["joes-plumbing"], "someone-else");
    const res = await uploadRoute(uploadRequest(png(), "image/png"), ctx(site.id));
    expect(res.status).toBe(404);
  });

  describe("with storage configured", () => {
    function configure() {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret");
      // Sem a chave publishable o login continua desligado (DEV_USER).
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
      const fetchMock = vi.fn(async () => Response.json({ Key: "ok" }));
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    it("uploads the photo and returns an owner SiteImage", async () => {
      const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
      const fetchMock = configure();
      const res = await uploadRoute(
        uploadRequest(png(1200, 800), "image/png", "  Our new van  "),
        ctx(site.id),
      );
      expect(res.status).toBe(201);
      const { image } = UploadImageResponse.parse(await res.json());
      expect(image).toMatchObject({
        source: "upload",
        kind: "owner",
        alt: "Our new van",
        width: 1200,
        height: 800,
      });
      expect(image.url).toMatch(
        new RegExp(
          `^https://abc\\.supabase\\.co/storage/v1/object/public/site-images/${site.id}/[0-9a-f]{32}\\.png$`,
        ),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rejects a file that is not really an image", async () => {
      const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
      const fetchMock = configure();
      const fake = new TextEncoder().encode("<svg onload=alert(1)>");
      const res = await uploadRoute(uploadRequest(fake, "image/png"), ctx(site.id));
      expect(res.status).toBe(400);
      expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a request without a file", async () => {
      const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
      configure();
      const form = new FormData();
      form.set("alt", "x");
      const res = await uploadRoute(
        new Request("http://localhost/x", { method: "POST", body: form }),
        ctx(site.id),
      );
      expect(res.status).toBe(400);
    });

    it("answers image_error when Storage fails", async () => {
      const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
      configure();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("bucket not found", { status: 404 })),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await uploadRoute(uploadRequest(jpeg(), "image/jpeg"), ctx(site.id));
      expect(res.status).toBe(502);
      expect(ApiError.parse(await res.json()).error.code).toBe("image_error");
    });
  });
});
