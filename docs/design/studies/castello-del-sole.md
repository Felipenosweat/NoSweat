# Castello del Sole — classic estate, typographic calm

- Live: https://www.castellodelsole.com/en/ (5-star beach resort & spa on a 140-ha estate with farm and winery,
  Ascona, Lake Maggiore; The Living Circle group)
- Award: positioner.com/corporate/awards (loaded live): "OCTOBER 2024 — HONORABLE MENTION — Castello del Sole —
  View on Awwwards" → https://www.awwwards.com/sites/castello-del-sole-ascona. Award page not loaded; no agency
  credit on the live site (same script fingerprint as Grand Hotel Miramare).
- Method: desktop/mobile/reduced runs, Tab test, styles, network, BOOK NOW clicked by coordinates (nothing
  submitted), 300px scroll sequence. Cookiebot "Allow all" clicked.

## Observation

- **Header:** "● MENU", language select, centred sun-emblem logo, "BOOK NOW" right; becomes sticky after scroll
  (class `header-sticky`).
- **Hero:** typographic. H1 "FIND YOUR UNIQUE PLACE OF REFUGE" in SangBleu Empire 700 uppercase 86.4px (32px
  mobile) on parchment #FEFBF5. A video (`landingpage-2048x1080.mp4`) is in the DOM but did not load in our run.
  Italic note: "We are closed for the winter season. We will welcome you again from 24 March 2027."
- **Order:** intro ("Surrounded by nature on a 140-hectare estate…") + quick links → aerial estate photo + arch-
  framed park photo → "DELIGHTFUL GASTRONOMIC VARIETY" carousel of 7 venues → blush band "SIGNATURE EXPERIENCES"
  as a deck of tilted cards that fans out → full-bleed room photo "A sense of home" → spa "Relax under the golden
  sun" → dark farm-to-table section → "Travel by train, we'll pick you up by boat" → group hotels strip (dark) →
  footer with address, tel, email, partner logos.
- **Type:** SangBleu Empire (700 caps H1; 400 H2 50.4/65.5; H3 28px), SangBleu Sunrise body 17/25.5 and labels
  12px 500 uppercase +2.4px.
- **Colour:** parchment #FEFBF5, brown text #483C34 (10.3:1), dark #211D19, blush #FDECEE, accent #B24955.
- **Booking:** BOOK NOW → full-screen beige "Book Castello del Sole": Book your stay (Book online, Special
  packages, Leaders club) · Book a table (3 restaurants) · Wellness · Experiences · "Give the gift of unforgettable
  experiences" (Gift vouchers). Close top right.
- **Motion:** fade-up reveals on cards; experience deck fans from stacked/tilted to spread. No change under
  reduced-motion emulation (0 rules).
- **Focus:** default outline, visible (seen on logo and a link).
- **Alt:** 99 of 121 images have no alt attribute.
- **Libraries (evidence):** window.gsap 3.12.2 + ScrollTrigger, Swiper, flatpickr; booking engine
  newbooking.azds.com — two builds of its vendor bundle (~1.35 MB each) loaded on the home page.
- **Weight:** 116 req / ~11 MB desktop; 114 / ~7.9 MB mobile; FCP 1.2 s, LCP 2.2 s.
- **Mobile:** sticky MENU / logo / BOOK NOW; Cookiebot covers the whole first screen until answered.

## Interpretation

- The quietest "luxury" of the set: one serif superfamily, case and tracking do all the work. This is the
  easiest pattern to generate reliably for a classic hotel or winery.
- The seasonal closing notice in the hero is honest and useful; owners always know this fact.
- The intent-grouped booking overlay (stay / table / spa / experiences / vouchers) fits multi-product
  hospitality businesses.

## Borrow

1. Typographic hero (heavy serif caps), parchment ground, brown ink.
2. Tracked micro-labels above titles.
3. Seasonal/opening notice from owner hours.
4. Booking overlay grouped by intent, incl. gift vouchers.
5. Card-fan moment for "experiences" (static under reduced motion).

## Do not carry over

- Missing alt on most images; duplicated booking-engine bundles; mobile cookie wall; SangBleu licence and emblem.

## Could not verify

- Award page/date; hero video; hover states; the booking engine flow.
