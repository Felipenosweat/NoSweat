# Tecnoarreda — dark rooms, one very thin word at a time

- Live: https://www.tecnoarreda.it/en/ (architecture, interior design and general contracting, Rovetta, BG).
- Award evidence (search only): WebSearch (extended) returned "Tecnoarreda Interior Design - Awwwards
  Honorable Mention" (awwwards.com/sites/tecnoarreda-interior-design); the summary says July 9, 2026,
  credited to LO Studio, built with GSAP. The live page has `window.gsap`, which matches. Awwwards itself
  not loaded.
- Method (2026-10-27): Playwright Chromium, desktop 1440×900 (wheel steps), a slower desktop pass (13 shots),
  mobile 390×844, desktop with reduced motion, computed styles, fonts, five Tab presses. The consent panel was
  left unanswered on purpose (to see what a first visit looks like). No screenshots in the repo.

## Observation

- **Ground:** near-black #0D0D0D throughout; white and light-grey text.
- **Hero:** a dark living-room photo; "ARCHITECTURE AND INTERIOR" top left and "DESIGN STUDIO" bottom
  right in thin capitals (H1, Astetes 100, 129.6 px / 142.6 px); "OUR SERVICES ↘" and "IT / EN" in the bar.
- **Sequence:** "Exclusive design, timeless emotions" → photos (a pendant over a dining table, a kitchen)
  revealed by clip-path → the manifesto "Home is more than a place: it is emotions…" in 53.8 px thin type
  with the last words greyed until scrolled → a vaulted indoor pool, full width, with "BALANCE OF FORMS"
  sliding across it at 172.8 px → two short paragraphs ("Trust a single point of contact…") → "WE DESIGN /
  WE BUILD / WE RENOVATE / WE FURNISH" as stacked words → "From concept to emotion: architecture executed
  to perfection" with a founder photo at the drawing table and his name as a script signature → PROJECTS.
- **Annotations:** a handwritten script (Nothing You Could Do) with drawn arrows: "STYLE DETAILS", "DETAIL
  IS A MARK OF EXCELLENCE".
- **Type (computed):** Astetes 100 for every heading; Anek Bangla 300 at 21.5/32.3 px for body (16.2/24.2
  on mobile).
- **Motion:** GSAP; 22 elements with clip-path, images with `transition: clip-path … 0.5s`; 14 text elements
  start at opacity 0. Reduced motion: the same counts, no visible change.
- **Consent:** an iubenda-style panel ("Reject all / Accept all / Learn more", with toggles for "Sale of my
  personal information") sits over the lower-left of every desktop shot and covers ~60% of the 390 px
  screen until answered.
- **Accessibility:** one H1; all 21 images have `alt`; `tel:+39034620880` and `mailto:` present.

## Interpretation

- The rooms carry the page; the type is a thin caption written across them. Very large + very light is
  what keeps the giant words from shouting.
- Services as four verbs is the clearest part of the site — a visitor learns the offer in one glance.
- The dark ground suits evening renders but hides daylight rooms, and greys on black at 300 weight are
  hard to read. The script annotations feel like a template kit, not the studio's own hand.

## Borrow

1. Services named as a short list of verbs/rooms set large, each with one plain paragraph.
2. If type goes big, it goes thin and short.
3. A founder photo at work, not a posed portrait (we do not have one for Hollis, so we use none).

## Do not carry over

- The consent panel over the first mobile screen; thin light-grey body on black; script annotations;
  reveals that ignore reduced motion; their black ground and display cut.

## Not verified

- Project pages, the menu panel, the award score.
