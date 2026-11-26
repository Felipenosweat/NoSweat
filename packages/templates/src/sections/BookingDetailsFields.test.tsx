import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookingDetailsFields, type BookingDetailsFieldsProps } from "./BookingDetailsFields";
import { EMPTY_BOOKING_DETAILS } from "./booking-form";
import { VISITOR_PRIVACY_URL } from "./ContactForm";

const noop = () => undefined;

function render(props: Partial<BookingDetailsFieldsProps> = {}): string {
  return renderToStaticMarkup(
    <BookingDetailsFields
      details={EMPTY_BOOKING_DETAILS}
      onChange={noop}
      errors={{}}
      onBlurField={noop}
      {...props}
    />,
  );
}

const VARIANTS: [string, boolean][] = [
  ["default", false],
  ["soft", true],
];

describe.each(VARIANTS)("booking details fields (%s variant)", (_name, soft) => {
  it("has labelled name, phone, email fields with the right autocomplete", () => {
    const html = render({ soft });
    for (const label of ["First name", "Last name", "Phone", "Email"]) {
      expect(html).toContain(`>${label}</label>`);
    }
    expect(html).toContain('autoComplete="given-name"');
    expect(html).toContain('autoComplete="family-name"');
    expect(html).toContain('autoComplete="tel-national"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain('type="tel"');
    expect(html).toContain('type="email"');
    // E-mail agora é obrigatório (não aparece mais como opcional); a nota continua opcional.
    expect(html.match(/\(optional\)/g)).toHaveLength(1);
  });

  it("starts on United States +1 and lists the other countries", () => {
    const html = render({ soft });
    expect(html).toContain('<option value="US" selected="">United States +1</option>');
    expect(html).toContain(">Mexico +52</option>");
    expect(html).toContain(">Dominican Republic +1</option>");
    expect(html).toContain('aria-label="Country calling code"');
  });

  it("links the privacy policy in a new tab and starts unchecked", () => {
    const html = render({ soft });
    expect(html).toContain(`href="${VISITOR_PRIVACY_URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("opens in a new tab");
    expect(html).toContain("I agree to the");
    expect(html).toContain('name="acceptedPrivacy"');
    expect(html).not.toContain("checked");
  });

  it("shows no cancellation card or checkbox when the owner wrote no policy", () => {
    for (const html of [render({ soft }), render({ soft, cancellationPolicy: "   " })]) {
      expect(html).not.toContain("Cancellation policy");
      expect(html).not.toContain("acceptedCancellation");
    }
  });

  it("shows the policy, the free-cancel window and the second checkbox", () => {
    const html = render({
      soft,
      cancellationPolicy: "No-shows are charged 50%.",
      cancellationHours: 24,
    });
    expect(html).toContain("Cancellation policy");
    expect(html).toContain("No-shows are charged 50%.");
    expect(html).toContain("Cancel free up to 24 hours before.");
    expect(html).toContain("I agree to the cancellation policy");
    expect(html).toContain('name="acceptedCancellation"');
    expect(html).toMatch(/aria-describedby="[^"]*-policy"/);
  });

  it("wires each error to its field with aria-invalid and aria-describedby", () => {
    const html = render({
      soft,
      errors: { phone: "Enter a 10-digit phone number, like (305) 555-0187.", email: "Bad." },
    });
    expect(html).toContain("Enter a 10-digit phone number, like (305) 555-0187.");
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
    expect(html).toMatch(/aria-describedby="([^"]*-phone)-error"/);
    expect(html).toMatch(/id="[^"]*-phone-error" role="alert"/);
    expect(html).toContain('aria-invalid="false"');
  });

  it("keeps the robot trap hidden and out of the tab order", () => {
    const html = render({ soft });
    expect(html).toContain('name="website"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("formats the phone for the selected country in the value", () => {
    const html = render({
      soft,
      details: { ...EMPTY_BOOKING_DETAILS, phone: "(305) 555-0187" },
    });
    expect(html).toContain('value="(305) 555-0187"');
    expect(html).toContain('placeholder="(305) 555-0187"');
  });
});

describe("booking details fields (variant classes)", () => {
  it("soft uses the .ns-s-* classes and default the ns-* utilities", () => {
    const soft = render({ soft: true, cancellationPolicy: "Please give notice." });
    expect(soft).toContain("ns-s-pair");
    expect(soft).toContain("ns-s-phone");
    expect(soft).toContain("ns-s-check");
    expect(soft).toContain("ns-s-policy");
    const plain = render({ cancellationPolicy: "Please give notice." });
    expect(plain).not.toContain("ns-s-");
    expect(plain).toContain("min-h-11");
    expect(plain).toContain("rounded-lg border border-ns-border");
  });
});
