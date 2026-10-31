# IMK Avocats: practice areas as an index

- Live: https://imk.ca/en/ (litigation boutique, Montréal; English and French)
- Award: search result title "IMK Avocats - Awwwards Honorable Mention" (awwwards.com/sites/imk-avocats);
  the summary gave "Honorable Mention - Mar 5, 2026". The agency page fatfish.ca/en/projects/imk-avocats
  (in the same results, not loaded) lists the mention and a CSS Design Awards Special Kudos. The live
  footer reads "Powered by fatfish". Award page not loaded (`access-log.md`).
- Method: Playwright, 2026-10-26, for the Mercer Law demo. Same protocol as `alkemist-avocats.md`
  (1440×900, 390×844 with touch, reduced motion, 5× Tab, computed styles, fonts, bytes). Cookie banner
  left untouched, so it appears in every capture. Screenshots stay in the scratchpad.

## Observations

- **Hero:** a dark full-width video band. At left, a small white note in a 190 px column: "Behind the
  letters IMK you will find a boutique law firm that specializes in litigation and dispute resolution."
  The h1 "Get us thinking for you." ends in a teal full stop; a round down-arrow sits at right. At 600 ms
  the embedded player showed "Video unavailable" before the video loaded.
- **Then, in order:** one intro paragraph (20/28 px in 645 px) + "Learn more"; "A team of 30 seasoned
  lawyers" beside a staggered grid of studio portraits on grey, with some tiles replaced by flat teal
  blocks; "Areas of practice" with a counter "16" in a circle and the h2 "Some of our areas of expertise.";
  a **two-column index** of the 16 areas (arrow, name, hairline under each row: Administrative, Appellate
  advocacy, Arbitration and mediation ... Shareholder disputes); news cards with teal dates; "Build your
  career with us"; footer of label/value columns (address, phone, fax, email).
- **Type (computed):** Geist throughout. h1 93.3 px desktop, 46.8 px mobile; h2 37.3/44.8 px −1.12 px;
  list rows and h3 17.1/22.2 px; body 15.6/23.3 px. RobotoSlab 300 and icon fonts also load. Ink #21272A,
  one teal accent.
- **Motion:** GSAP and Lenis are present (html class `lenis`), one CSS animation running after load. Which
  elements GSAP animates was not traced.
- **Mobile:** the index becomes one column of large rows; portraits two per row; no horizontal overflow.
  The cookie bottom sheet covers about 40% of the first screen.
- **Accessibility and weight:** all 14 images have `alt`; one h1. After 5× Tab the active element was the
  document body and no focus indicator was visible. `tel:` links are written "tel:514935-4460". About
  6.6-8.2 MB and 113-115 requests per run.

## Interpretation

- The index is the best part: a law-firm visitor wants to know "do they do my kind of case?", and a
  numbered, ruled list answers faster than cards or an icon grid. The count ("16") makes it feel complete.
- One grotesk and one accent used only for tiny signals (a full stop, a date, a counter) is what makes the
  page feel careful. The portraits do the warmth.

## Borrow (for Mercer Law)

1. Services as an index with numbers, names and hairlines; the price on the same line (our addition, from
   the fixture's flat fees), so the index is also the fee list.
2. One accent colour reserved for small signals (the active row's rule, section numbers, prices).
3. A short note beside the headline that says, in one sentence, what kind of office this is.

## Do not carry over

- Lost focus on Tab, the malformed `tel:` links, the cookie sheet over the first mobile screen.
- A portrait wall: a two-person office has no such photos, and stock people must never stand in for staff.
- The video hero with a third-party player; their typeface and photography.

## Not verified

- The award page; what GSAP drives; the practice detail pages; the French version.
