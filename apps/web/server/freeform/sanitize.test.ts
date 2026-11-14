import { describe, expect, it } from "vitest";
import { isDangerousUrl, sanitizeFreeformHtml } from "./sanitize";

const clean = (html: string, options = {}) => sanitizeFreeformHtml(html, options).html;

describe("sanitizeFreeformHtml", () => {
  it("keeps a normal page untouched", () => {
    const page = `<!doctype html>
<!-- ns:direction Poster type, ink on kraft paper. -->
<html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces&display=swap">
<link rel="icon" href="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">
<style>a > b { color: red } .x::before { content: "<b>" }</style></head>
<body><a href="tel:+15551234567" onclick="track()">Call</a>
<form data-ns-contact><input name="name"><button type="submit">Send</button></form>
<script>for (let i = 0; i<n; i++) { el.innerHTML = '<a href="#x">x</a>'; }</script>
</body></html>`;
    const result = sanitizeFreeformHtml(page);
    expect(result.removed).toEqual([]);
    expect(result.html).toBe(page);
  });

  it("removes external scripts but keeps inline ones", () => {
    const result = sanitizeFreeformHtml(
      `<script src="https://evil.example/x.js"></script><script>console.log(1)</script>`,
    );
    expect(result.html).toBe("<script>console.log(1)</script>");
    expect(result.removed).toEqual(['<script src="https://evil.example/x.js">']);
  });

  it("keeps scripts from allowlisted hosts and drops unclosed external ones", () => {
    expect(
      clean(`<script src="https://cdn.ok.test/a.js"></script>`, { scriptHosts: ["cdn.ok.test"] }),
    ).toBe(`<script src="https://cdn.ok.test/a.js"></script>`);
    expect(clean(`<p>a</p><script src="//evil.example/x.js">`)).toBe("<p>a</p>");
  });

  it("removes iframes, objects, embeds, frames and base", () => {
    const html = clean(
      `<p>a</p><iframe src="https://x.test"><p>fallback</p></iframe><object data="x.swf"><param name="a"></object><embed src="x.swf"><base href="https://evil.example/"><frame src="x"><p>b</p>`,
    );
    expect(html).toBe("<p>a</p><p>b</p>");
  });

  it("removes an unclosed iframe tag", () => {
    expect(clean(`<p>a</p><iframe src="https://x.test">`)).toBe("<p>a</p>");
  });

  it("removes meta refresh but keeps other meta tags", () => {
    expect(
      clean(
        `<meta http-equiv="Refresh" content="0; url=https://evil.example"><meta name="description" content="Hi">`,
      ),
    ).toBe(`<meta name="description" content="Hi">`);
  });

  it("strips form action and formaction attributes", () => {
    const result = sanitizeFreeformHtml(
      `<form data-ns-contact action="https://evil.example/collect" method="post"><button formaction="https://evil.example">Send</button></form>`,
    );
    expect(result.html).toBe(`<form data-ns-contact method="post"><button>Send</button></form>`);
    expect(result.removed).toHaveLength(2);
  });

  it("neutralizes javascript: URLs, including encoded ones", () => {
    expect(clean(`<a href="javascript:alert(1)">x</a>`)).toBe(`<a href="#">x</a>`);
    expect(clean(`<a href="  JaVaScRiPt:alert(1)">x</a>`)).toBe(`<a href="#">x</a>`);
    expect(clean(`<a href="jav&#x61;script&colon;alert(1)">x</a>`)).toBe(`<a href="#">x</a>`);
    expect(clean(`<a href="java\tscript:alert(1)">x</a>`)).toBe(`<a href="#">x</a>`);
    expect(clean(`<a class="c" href='data:text/html,<script>1</script>'>x</a>`)).toBe(
      `<a class="c" href="#">x</a>`,
    );
  });

  it("keeps inline event handlers (the sandboxed preview contains them)", () => {
    expect(clean(`<button onclick="openMenu()">Menu</button>`)).toBe(
      `<button onclick="openMenu()">Menu</button>`,
    );
  });

  it("only allows Google Fonts and data: icons in <link>", () => {
    const result = sanitizeFreeformHtml(
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><link rel="stylesheet" href="https://cdn.evil.example/x.css"><link rel="icon" href="data:image/svg+xml,x">`,
    );
    expect(result.html).toBe(
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><link rel="icon" href="data:image/svg+xml,x">`,
    );
    expect(result.removed).toEqual(['<link href="https://cdn.evil.example/x.css">']);
  });

  it("only keeps images from the allowed photo list or inline data", () => {
    const allowed = "https://images.unsplash.com/photo-1?w=1600&q=80";
    const html = clean(
      `<img src="${allowed.replace("&", "&amp;")}" alt="a"><img src="https://hotlink.example/b.jpg" alt="b"><img src="data:image/svg+xml,x" alt="c">`,
      { imageUrls: [allowed] },
    );
    expect(html).toBe(
      `<img src="${allowed.replace("&", "&amp;")}" alt="a"><img src="data:image/svg+xml,x" alt="c">`,
    );
  });

  it("drops srcset that points outside the allowed photos", () => {
    expect(
      clean(`<img src="https://ok.test/a.jpg" srcset="https://other.test/a.jpg 2x" alt="a">`, {
        imageUrls: ["https://ok.test/a.jpg"],
      }),
    ).toBe(`<img src="https://ok.test/a.jpg" alt="a">`);
  });

  it("does not treat code inside <script> or <style> as tags", () => {
    const page = `<style>.a{background:url("x")}</style><script>if (a<b && c>d) { x = "<iframe>"; }</script>`;
    expect(clean(page)).toBe(page);
  });
});

describe("isDangerousUrl", () => {
  it("flags script and document URLs only", () => {
    expect(isDangerousUrl("javascript:void(0)")).toBe(true);
    expect(isDangerousUrl("vbscript:x")).toBe(true);
    expect(isDangerousUrl("data:text/html;base64,AAAA")).toBe(true);
    expect(isDangerousUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isDangerousUrl("tel:+15551234567")).toBe(false);
    expect(isDangerousUrl("mailto:a@b.co")).toBe(false);
    expect(isDangerousUrl("#contact")).toBe(false);
    expect(isDangerousUrl("https://example.com")).toBe(false);
  });
});

describe("sanitizeFreeformHtml script allowlist", () => {
  it("keeps only the exact pinned animation scripts", async () => {
    const { FREEFORM_SCRIPT_URLS } = await import("./assets");
    const ok = FREEFORM_SCRIPT_URLS[0];
    const result = sanitizeFreeformHtml(
      `<script src="${ok}"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/evil/1.0/x.js"></script>`,
      { scriptUrls: FREEFORM_SCRIPT_URLS },
    );
    expect(result.html).toBe(`<script src="${ok}"></script>`);
    expect(result.removed).toEqual([
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/evil/1.0/x.js">',
    ]);
  });
});
