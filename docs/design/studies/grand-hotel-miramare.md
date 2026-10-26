# Grand Hotel Miramare — heritage reinvented (Riviera red)

- Live: https://www.grandhotelmiramare.it/en/ (5-star grand hotel, Santa Margherita Ligure; "120 years young",
  run by the Fustinoni family since 1945)
- Award: positioner.com/corporate/awards (loaded live) lists "MARCH 2024 — HONORABLE MENTION — Grand Hotel
  Miramare — View on Awwwards" → https://www.awwwards.com/sites/grand-hotel-miramare. Awwwards page not loaded.
  The live site has no agency credit; its scripts (`psk-gallery.min.js`, an identical `vce701823e…` script,
  gsap 3.12.2, flatpickr, swiper) match Castello del Sole, also claimed by Positioner. The site now celebrates
  120 years (2026), so it may be a revised version of what was awarded.
- Method: as in the other studies (desktop/mobile/reduced-motion runs, Tab test, computed styles, network,
  "BOOK NOW" clicked by coordinates on both breakpoints, 300px scroll sequence). Nothing submitted.

## Observation

- **Hero:** full-bleed video (woman leaning on a sea balustrade), wordmark "GRAND HOTEL MIRAMARE ★★★★★" centred,
  kicker "KNOWN AS 'THE MIRA' TO FRIENDS & FAMILY", tilted script H1 "Celebrate the Estate Italiana"
  (Gracia 500, 139.7px; 70px mobile), BOOK NOW top right, burger top left.
- **Order:** red all-caps manifesto ("NOW 120 YEARS YOUNG — OWNED AND RUN BY THE FUSTINONI FAMILY SINCE 1945 —
  … VONGOLE AT THE BEACH. COFFEE ON THE TERRACE…") with a rotating sun badge → photo collage (pool, book,
  balustrade, beach umbrella) moving at different speeds → saffron-yellow story slider ("Miramare's Pesto alla
  Genovese", 15 slides, arrows + numbers) → "01 ROOMS" → tabs Pool / Beach / Gardens / Gastronomy / Wellness
  with script "The Hotel's Beating Heart" → "WALK IN A TRAVELER. WALK OUT AN ITALIAN." + quote + photo strip
  → "A LIGURIAN WELLNESS RETREAT" offer → news with archival B&W photo "120 YEARS OF GRAND HOTEL MIRAMARE"
  → partner logos (LHW, Virtuoso, Michelin 2025…) → footer framed by a red scalloped awning border, crest,
  "VIA MILITE IGNOTO N° 30", tel, email.
- **Type:** Gracia (script H1), Tilda Grande (script H2 100/90, 60px mobile), EngraversGothicBold
  (labels/CTAs 20px caps, +0.8px), Helvetica body 18px.
- **Colour:** cream #FAF4E9, red #CC0000 for body text and CTAs (5.4:1 on cream), saffron #FDC214 band (red on
  saffron 3.6:1), ink #141414 for H2.
- **Booking:** BOOK NOW → full-screen cream panel, crest, script "Book your stay", ARRIVAL – DEPARTURE,
  2 ADULTS ±, 0 CHILDREN ±, red BOOK NOW (→ secure-hotel-booking.com D-EDGE), and "ADVANTAGES FOR DIRECT
  WEBSITE RESERVATIONS" (exclusive rates, 5–10% discount, WiFi, complimentary minibar).
- **Header:** the fixed header sits at `top:-82px` until scroll; a separate copy is drawn over the hero.
- **Focus:** Tab ×3 focused MENU / logo / BOOK NOW of the hidden header; no ring visible on screen.
- **Reduced motion:** no visible change; the only rule is `scroll-behavior: smooth` under no-preference.
- **Mobile:** same structure; "VIEW FULL VIDEO" link; Didomi consent bar (not accepted in our run) covered the
  bottom ~30% of every screenshot.
- **Libraries (evidence):** window.gsap 3.12.2 + window.ScrollTrigger; jquery, swiper, flatpickr scripts.
- **Weight:** 148 req / ~4.7 MB desktop, 131 / ~2.6 MB mobile; FCP 1.2 s, LCP 2.4 s desktop, 1.4 s mobile.

## Interpretation

- A heritage grand hotel presented like a fashion brand. Heritage lives in a few graphic signals (crest,
  awning scallops, engraved caps, founding year, one archival photo), and everything else is sunny and
  present-day. This is the best model in the set for "royal but not stuffy".
- Using the brand red for all text is bold and still legible; it only fails on the yellow band.
- Direct-booking benefits inside the booking panel are a conversion idea we can reuse when the owner states them.

## Borrow

1. Heritage motif → graphic system (border, badge, footer frame) in one brand colour.
2. All-caps manifesto with owner facts (founded, family, what you do there).
3. Script display + engraved caps labels + plain sans body.
4. Booking panel with dates/guests + owner-stated "book direct" perks.
5. One colour-block band for a story slider.

## Do not carry over

- Hidden duplicate header (invisible focus); small red-on-yellow text; mobile consent covering the screen;
  their crest, motif, fonts, photos.

## Could not verify

- Award page/date and whether the current site is the awarded version; hover states; video content.
