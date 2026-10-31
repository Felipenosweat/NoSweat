# Sonoma Bakery — the crust as the hero

- Live: https://sonomabakery.com/ (sonoma.com.au redirects there). Artisan sourdough bakery with several
  Sydney shops.
- Award: WebSearch result "Sonoma Bakery - Awwwards Honorable Mention" (awwwards.com/sites/sonoma-bakery),
  summary "(NIGHTJAR) … Jun 6, 2022". The live HTML has the comment "Site by https://nightjar.co", which
  matches the credited studio. The site may have been updated since the award; award page not loaded.
- Method (2026-10-26): Playwright Chromium, desktop 1440×900 (first pass with window scroll stayed on
  the hero, because the page scrolls inside a transformed container; second pass with mouse-wheel over
  the page, 6 shots), mobile 390×844 (8 shots), reduced-motion desktop run, computed styles, fonts,
  animation count.

## Observations

- **Desktop scroll model:** `document.documentElement.scrollHeight` = 900 (the viewport). The wheel moves an
  inner, transform-based scroller; `window.scrollY` stays 0.
- **First screen:** one dark macro of a scored, floured sourdough crust, edge to edge. White text, one
  sentence at 28.8 px: "Pure intentions, humble beginnings, quality focus & exceptional customer service.
  Available in store today." ("Available in store" underlined as a link). Header: "SONOMA" + a tiny
  "ARTISANAL BAKERS / EST …" stamp, PRODUCTS / ARTISAN / LOCATIONS, a "PICKUP ↗" link right.
- **Then:** loaf strip (photo, name, price in a typewriter face: "SONOMA MICHE 19.50 BREAD"); a tan block
  with the founder's quote "It takes 36 hours and a lifetime of experience to make a single loaf…" signed
  "Andrew Connole – Founder"; photos of dough being cut and honey poured; origin paragraph ("Sonoma's story
  begins in the late 1940s…"); mailing list; four-column link footer with phone and email; and a final
  full-width photo panel "UP NEXT — Shop".
- **Type:** BrutGrotesqueBook 400 for everything (h1 64 px / 70.4, h2 32–52 px, body 16/22.4). Typewriter
  Condensed 700, 14 px caps, 0.15em tracking for product rows and the "UP NEXT" label.
- **Motion:** no Web Animations at idle; no visible difference under reduced-motion emulation.
- **Mobile:** normal document scroll (≈3 900 px), same blocks stacked; `tel:` links in menu and footer;
  12/12 images with alt.

## Interpretation

- The crust photo does all the persuading. The restraint (one grotesk, one sentence) reads as confidence.
- The process time stated as a number by the founder ("36 hours") is the kind of fact our fixture has
  ("ferments for 48 hours") and should be set big, not buried.
- The typewriter price row turns the menu into a ticket: cheap to build, very bakery.
- The inner scroller is a cost without benefit for a small business (anchors, find-in-page, a11y).

## Borrow

1. One full-bleed texture photo + one sentence for the first screen.
2. Ticket-style price rows in a small mono/typewriter voice.
3. The owner's process number as a headline.
4. "Up next" end-of-page panel.

## Do not carry over

- Transform-based page scroller; hours/address hidden on other pages; their photos and identity.
