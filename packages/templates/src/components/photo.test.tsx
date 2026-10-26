import type { SiteImage } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Photo, photoSrcSet, SRCSET_WIDTHS } from "./photo";

const entries = (srcSet: string | undefined) =>
  (srcSet ?? "").split(", ").map((entry) => {
    const [url = "", width = ""] = entry.split(" ");
    return { url: new URL(url), width };
  });

describe("photoSrcSet", () => {
  it("monta as larguras da Unsplash com formato automático e a mesma qualidade", () => {
    const src =
      "https://images.unsplash.com/photo-1?ixid=abc&ixlib=rb-4.1.0&w=1600&q=80&fm=jpg&fit=max";
    const list = entries(photoSrcSet(src));
    expect(list.map((e) => e.width)).toEqual(SRCSET_WIDTHS.map((w) => `${w}w`));
    for (const [i, { url }] of list.entries()) {
      expect(url.searchParams.get("w")).toBe(String(SRCSET_WIDTHS[i]));
      expect(url.searchParams.get("auto")).toBe("format");
      expect(url.searchParams.get("q")).toBe("80");
      expect(url.searchParams.get("ixid")).toBe("abc");
      expect(url.searchParams.has("fm")).toBe(false);
    }
  });

  it("mantém a proporção do corte quando a Unsplash tem altura fixa", () => {
    const src = "https://images.unsplash.com/photo-2?auto=format&fit=crop&w=1200&h=1500&q=80";
    const first = entries(photoSrcSet(src))[0]!.url;
    expect(first.searchParams.get("w")).toBe("480");
    expect(first.searchParams.get("h")).toBe("600");
  });

  it("usa compressão e largura da Pexels", () => {
    const list = entries(photoSrcSet("https://images.pexels.com/photos/1/a.jpeg"));
    expect(list).toHaveLength(SRCSET_WIDTHS.length);
    const { url } = list[1]!;
    expect(url.pathname).toBe("/photos/1/a.jpeg");
    expect(url.searchParams.get("auto")).toBe("compress");
    expect(url.searchParams.get("cs")).toBe("tinysrgb");
    expect(url.searchParams.get("w")).toBe("768");
  });

  it("troca a largura que a Pexels já tinha", () => {
    const list = entries(
      photoSrcSet("https://images.pexels.com/photos/1/a.jpeg?auto=compress&cs=tinysrgb&w=1920"),
    );
    expect(list.map(({ url }) => url.searchParams.getAll("w"))).toEqual(
      SRCSET_WIDTHS.map((w) => [String(w)]),
    );
  });

  it("deixa sem srcset as fotos locais, do Supabase e de outros endereços", () => {
    expect(photoSrcSet("/photos/example-plumbing.webp")).toBeUndefined();
    expect(
      photoSrcSet("https://abc.supabase.co/storage/v1/object/public/site-images/u/1.jpg"),
    ).toBeUndefined();
    expect(photoSrcSet("https://cdn.example.com/owner-1.jpg")).toBeUndefined();
  });
});

describe("Photo", () => {
  const image: SiteImage = {
    url: "https://images.pexels.com/photos/1/a.jpeg",
    alt: "Tools",
    source: "pexels",
    kind: "scene",
    width: 1600,
    height: 1067,
  };

  it("carrega sob demanda por padrão", () => {
    const html = renderToStaticMarkup(<Photo image={image} sizes="50vw" />);
    expect(html).toContain('loading="lazy"');
    expect(html).not.toMatch(/fetchpriority/i);
    expect(html).toContain('sizes="50vw"');
    expect(html).toMatch(/srcset="https:\/\/images\.pexels\.com\/photos\/1\/a\.jpeg\?auto=compress/i);
  });

  it("com priority carrega já e com prioridade alta", () => {
    const html = renderToStaticMarkup(<Photo image={image} priority sizes="100vw" />);
    expect(html).toContain('loading="eager"');
    // O React escreve o atributo como fetchPriority ou fetchpriority (HTML não diferencia).
    expect(html).toMatch(/fetchpriority="high"/i);
    expect(html).toContain('decoding="async"');
  });

  it("não põe srcset nem sizes inventado em foto local", () => {
    const html = renderToStaticMarkup(
      <Photo image={{ ...image, url: "/photos/example-plumbing.webp", source: "upload" }} />,
    );
    expect(html).not.toMatch(/srcset/i);
    expect(html).not.toContain("sizes=");
    expect(html).toContain('src="/photos/example-plumbing.webp"');
  });
});
