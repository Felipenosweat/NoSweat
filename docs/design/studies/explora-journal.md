# The Explora Journal: brand travel journal, quiet luxury

- Live: https://explorajourneys.com/us/en/explora-journal (the magazine section of Explora Journeys, a luxury cruise line)
- Award: listed under Awwwards Magazine / Newspaper / Blog via search: "The Explora Journal received an Honorable
  Mention on September 12, 2026." The award page itself was not found or loaded, and no agency credit appears
  on the live page. See `access-log.md`.
- Method: Playwright (Chromium), 2026-10-26. Desktop 1440×900 and mobile 390×844 (iPhone UA, touch), screenshots
  at load (600 ms), top and every ~1200 px (desktop) / 900 px (mobile) via mouse.wheel steps, bottom; one desktop
  run with `reducedMotion: 'reduce'`; 5× Tab + screenshot; computed styles and `document.fonts`; network sizes
  from `requestfinished`. Second pass opened the article "Introducing EXPLORA III" (desktop + mobile) and measured
  paragraph metrics. Screenshots: `shots/explora/`.

## Observations

- **Index structure:** utility bar ("Talk to an Explora Ambassador. +1 833 925 1567") → main nav (FIND A JOURNEY,
  DESTINATIONS, SHIPS, THE EXPLORA EXPERIENCE, OFFERS & FARES, STORIES, search, account, "Contact Us" outline
  button, navy "Reserve" button) → h1 "The Explora Journal" + italic serif subtitle "A Magazine by Explora
  Journeys" → a 1360 px lead photo (aerial ship deck) with a sand caption card overlapping the lower-left corner
  (THE SHIPS / Introducing EXPLORA III / Read Story).
- **Sticky category bar** (All categories / The Destinations / The Journeys / The Ships / The Elements, "Sort by:
  Latest", two grid-density icons). After ~1 viewport of scrolling the main header disappears and only this bar
  stays at the top.
- **Card rhythm:** two columns of unequal image sizes and vertical offsets (left card ~250 px wide image, right
  ~310 px, staggered by ~50–100 px), grid measured as 10 columns of 124.8 px inside 96 px side padding. Every
  few cards a **full-bleed tinted band** (sand #E7E1DA or olive #DADABB) puts text left and a large photo right
  (Anna Nash portrait; a b/w tennis photo for Jannik Sinner).
- **Kicker format:** "THE DESTINATIONS • 7 MIN READ", Shapiro 11 px, uppercase, ~1.3 px tracking, bronze
  #866D4B. Card titles SangBleu 20/28 px; excerpts Shapiro 14–15 px.
- **Article page:** breadcrumb (All Stories > The Ships > Introducing EXPLORA III) → wide hero photo →
  intro paragraph 18/25.2 px in a 630 px block at the right → body column 600 px wide starting at x=420, 18/25.2 px
  (measured ~56–67 characters per line), serif h2 28/39.2 px ("Maybe the best hotel isn't a hotel",
  "Perfecting the Concept of 'Homes at Sea'") → asymmetric image pairs (small left, large right, offset
  vertically) → "More Stories" strip of 6 portrait cards → newsletter bar → large footer with accordions on
  mobile. Footer sign-off in italic serif: "_Maybe_ the best hotel _isn't a hotel_".
- **Fonts (computed + document.fonts):** WT Monarch Nova 400 (h1 40 px / mobile 36 px, article h1 40 / 28 px),
  Sangbleu (files SangBleuRepublic Regular + Italic), Shapiro (several cuts). Card titles declare weight 100,
  but only the Regular file loads.
- **Colours:** page #F4F2EF, bands #E7E1DA / #DADABB, text #222, kicker #866D4B, secondary #666, Reserve #0C2340.
- **Motion:** none detected. `document.getAnimations()` = 0, no GSAP, no Lenis class, no canvas. The
  reduced-motion run gave the same screenshots. The 600 ms frame shows the hero image narrower (558 px) than at
  6 s; this is probably late CSS/JS, not a designed animation (not confirmed).
- **Mobile:** hamburger, centered logo, account icon and **phone icon** (tel link). The category bar scrolls
  sideways. Single column, 20 px serif titles, 15 px body; no horizontal overflow.
- **Accessibility:** the first two Tab stops are the accessiBe overlay (`ACCESS-WIDGET-UI`, acsbapp.com). The
  nav links have `outline: none` and the focus screenshot shows no visible indicator. 21 images have no alt
  attribute on the index. Contrast: body 14.2:1, kicker 4.37:1 (11 px, just below AA), 70% grey text ≈3.9:1.
- **Performance:** about 9.6 MB and 322 requests on desktop (images 3.7 MB, scripts 3.1 MB, Bing, LinkedIn,
  Contentsquare, Teads, GTM, reCAPTCHA, Google Maps). Fonts ≈220 KB.

## Interpretation

- This is the closest of the five to a luxury hotel: a hospitality brand using a magazine to sell a feeling,
  with the booking path visible but quiet. The footer line literally compares itself to a hotel.
- The authored feel comes from layout rhythm (staggered cards, tinted bands, the overlapping caption card) and
  from three typographic voices, not from motion. That makes it cheap to build and robust on any device.
- Type sizes are modest (max 40 px). On a site with weaker photos this would feel flat, because the images do the
  heavy lifting.

## Borrow (for customer sites)

1. "Stories" section for hotels: lead story with an overlapping caption card, then staggered 2-up cards with
   kicker "ROOMS • 3 MIN READ" style labels (facts only).
2. Tinted full-bleed band every 4–6 items to reset the rhythm.
3. Reading column: 18 px body, ~600 px wide, serif h2 at ~1.55× body.
4. Persistent "Reserve" (dark, sober) + phone in the header; phone icon on mobile.
5. Italic serif reserved for one subtitle and one sign-off line.

## Do not carry over

- Overlay accessibility widget; removed focus outlines; small bronze labels below 4.5:1.
- Tracker-heavy page weight.
- Their typefaces (commercial), logo and photography.

## Not verified

- The Awwwards award page, score and agency.
- Hover states beyond one card hover (no visible change), keyboard use of the filter, and the grid-density toggle.
- Whether any motion is disabled by reduced motion (none was detected either way).
