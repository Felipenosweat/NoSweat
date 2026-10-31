# Enoteca della Valpolicella — a kitchen notebook

- Live: https://www.enotecadellavalpolicella.it/ (wine bar and kitchen in Fumane, Verona). Italian only.
- Award: only a WebSearch summary of an Awwwards listing page: "Enoteca della Valpollicella (ET Studio),
  a wine bar site, is listed with an Honorable Mention on Jul 25, 2025" (the summary warned that dates in
  that listing run together). No /sites/ page found; no studio credit on the live site. Match by name
  only: treat the award as probable, not confirmed (`evidenceStatus: partial`).
- Method (2026-10-26): Playwright Chromium, desktop 1440×900 (wheel, 8 shots), mobile 390×844 (8 shots),
  reduced-motion run, computed styles, fonts, transform diff. The cookie panel was not dismissed and
  covers part of every screenshot.

## Observations

- **Paper and rules:** cream page (rgb 249,243,227), black text, a thin black rule under a fixed top bar:
  "INDICE" left, HOME / MENU / MANIFESTO / VINI / PERSONE, "PRENOTA" right (mobile: INDICE + PRENOTA only).
- **Opening:** "L'ENOTECA" huge and centred (SelfModern caps, ~100 px), small notes around it ("QUESTO È
  L'ENOTECA DI ADA", "BENVENUT*", "DIAMO A CASA"), a blue handwritten note under the title, then a photo.
- **Chapters:** big Roman numeral (I, II, III, IV) + "N°001…" + one huge word ("BELIEVES", "IN PEOPLE",
  "AND TERRA"); typewriter paragraphs in two columns; photos tilted a few degrees like prints; the menu
  chapter is a white card with "MENU" and a black-and-white photo.
- **Type:** SelfModern (display), CourierNew 16/32 px for all body and nav, "September" handwriting for
  marginal notes in blue ink. No h1.
- **Motion:** Lenis smooth scroll (window.scrollY stayed 0); transforms still changed under
  reduced-motion emulation.
- **Contact:** no `tel:` link found.

## Interpretation

- The notebook metaphor (typewriter + handwriting + prints on paper) is what makes it feel run by people.
  The handwritten note works because it is rare and in one ink colour.
- Index + book action fixed in the top bar keep a long, slow page usable.
- Courier for every paragraph is tiring; long text needs a proper text face.

## Borrow

1. One handwritten "ink" voice for tiny human notes (times, tips), one colour, used sparingly.
2. Printed-photo treatment (slight tilt, paper margin) for a few images.
3. Index + main action fixed in the top bar.

## Do not carry over

- Courier body copy, no h1, no tel:, cookie panel over content, smooth scroll ignoring reduced motion.
