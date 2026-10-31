# Gardenlust — garden design as a stone-paper collage (Sydney)

- Live: https://www.gardenlust.com.au/ (garden design, landscaping and maintenance; founder Axel Vérité).
- Award evidence (search only): WebSearch `awwwards.com/sites landscaping honorable mention` → summary:
  "Gardenlust received an honorable mention on August 26, 2021, credited to Made Agency." The live footer
  says "WEBSITE BY MADE" and links madeagency.com.au, so the award ↔ site match is by credit, not only by
  name. Awwwards itself is unreachable from here; the site may have changed since 2021.
- Method (2026-10-26): Playwright Chromium, desktop 1440×900 (the page ignores `window.scrollTo`, so a
  second run used 48 wheel steps with screenshots every 4), mobile 390×844 touch run (10 shots),
  reduced-motion desktop run (wheel), computed styles, `document.fonts`, Tab ×6. No screenshots kept in
  the repo.

## Observations

- **Hero:** full-bleed aerial photo of a terraced garden (lawn, boulders, pool, stairs). Centred wordmark
  "GARDENLUST" in a light serif with tiny tracked "PARIS" above and "SYDNEY" below; a monogram top-left and
  a two-line menu icon top-right. No phone, no action button in the first screen.
- **Collage chapter:** the ground turns to a pale stone (#E2E5D7-ish). Two statements in uppercase Didot
  ("WE DESIGN SPACES THAT WILL NURTURE / _YOUR HEART, SOUL AND MIND._", "WE OFFER COMPREHENSIVE SERVICES
  INCLUDING, / _LANDSCAPE DESIGN, INSTALLATION AND MAINTENANCE._") with the second line in italic and
  indented. Around them, photos of steps, succulents and a stone pier at three or four sizes, staggered
  vertically, plus one hairline crossing the composition. "VIEW GARDENS" / "VIEW SERVICES" as small
  underlined caps.
- **Dark chapters:** deep leaf green (#253527 as text colour on stone; a near-black green #212321 as the
  body background) for projects (landscape frames), the founder ("FROM PARIS _WITH LOVE_", portrait, a
  script signature), a testimonial slider (01/02/03), "INSTAGRAM → FOLLOW", and the contact end
  "LETS TALK ABOUT YOUR _NEW GARDEN_" with phone and e-mail in small caps.
- **Type (computed):** Didot 500 uppercase 48/57.6 px desktop, 20/24 px mobile; Brown-light 22/33 px for
  testimonial text (12/18 px on mobile). No `<h1>`.
- **Motion:** desktop scroll is replaced: `html` and `body` have `overflow: hidden`, `scrollY` stays 0 and
  the wheel moves a transformed container; photos in the collage move at different speeds. GSAP 3.7 with
  ScrollTrigger, ScrollToPlugin and SplitText, Swiper, Lottie, jQuery. Reduced-motion emulation: same
  sequence. Mobile: native scroll, the collage stacks into a single column with offsets kept.
- **Contact:** `tel:+610290340875` (keeps the trunk 0 after +61, so it is malformed), two `mailto:`.
- **Focus:** every tabbed element reported `outline: none`.

## Interpretation

- The collage is what makes it feel designed: the same six project photos in a grid would look like any
  landscaper. Different scales + vertical stagger + one paper ground = "prints laid on a table".
- The italic second line is a cheap, strong second voice for a serif; it works because it is used on
  every statement, not once.
- The palette comes out of the photos (stone, leaf green, shade) and the site never adds a brand accent.
- The cost: scroll hijack, no h1, invisible focus, phone only in the footer — a landscaper's customer
  usually wants a quote or a call first.

## Borrow (for Greenline)

1. Hero and services as a collage of 2–3 photo scales on one warm paper ground.
2. Serif statements with an italic second voice.
3. Earth palette derived from the photos; no extra accent.

## Do not carry over

- Scroll takeover; no reduced-motion variant; no h1; outline removed; malformed tel:.
- Their wordmark, Didot/Brown pair, founder signature and photos.
