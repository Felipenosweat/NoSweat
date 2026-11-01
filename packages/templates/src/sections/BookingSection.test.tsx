import { fixtures } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../SiteRenderer";

const base = fixtures["joes-plumbing"];
const spec: SiteSpec = {
  ...base,
  business: { ...base.business, phone: "(619) 555-0142" },
  sections: [
    ...base.sections,
    { type: "booking", title: "Book online", intro: "Pick a service and a time that works." },
  ],
};

describe("booking section", () => {
  it("renders the heading, the intro and a call fallback when an endpoint exists", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={spec} bookingEndpoint="/api/public/booking/site-1" />,
    );
    expect(html).toContain('id="book"');
    expect(html).toContain("Book online");
    expect(html).toContain("Pick a service and a time that works.");
    expect(html).toContain("Call us to book");
    expect(html).toContain('href="#book"');
  });

  it("renders nothing without an endpoint on the published site", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).not.toContain("Call us to book");
    expect(html).not.toContain("Pick a service and a time that works.");
  });

  it("shows how to turn booking on inside the editor", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} editable />);
    expect(html).toContain("Online booking appears here once you turn it on");
    expect(html).toContain(">Edit Booking</button>");
  });
});
