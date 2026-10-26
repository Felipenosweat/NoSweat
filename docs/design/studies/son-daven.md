# Son Daven — immersive, nature-led resort hotel story (Carpathians)

- Live: https://sondaven.com/en (redirects from / to /ua). "Resort design hotel in Yaremche"
  (Ivano-Frankivsk region, Ukraine), presented as an **investment project** by developer Blago,
  construction 2026–2029. The building is shown as CGI renders; lifestyle photos (bonfire, children on
  rocks, yoga, spa) are mixed in.
- Award evidence (search only): WebSearch `awwwards "Site of the Month" June 2026` → summary: "The Awwwards
  Sites of the Month page lists **Son Daven** as the June 2026 Site of the Month … tagged Site Of The Month
  Jun, 2026, and carries a Business & Services Honors label from May 2026." The match to sondaven.com is by
  name (title "Son Daven — …дизайн-готель у Яремче"); no studio credit was found on the live page, and
  `"Son Daven" awwwards` returned nothing else. Treat the award link as probable, not confirmed.
- Method (2026-10-26): Playwright Chromium 1194, SwiftShader WebGL, MP4s served as WebM transcodes
  (H.264 unsupported in this build). Desktop 1440×900 wheel run (18 shots to the bottom of 33 200 px),
  mobile 390×844 touch run (12 shots, 22 400 px), reduced-motion desktop run, Tab ×6, network log.
  The custom cookie panel ("COOKIES [X] … OK") could not be dismissed by our scripts (neither the "OK"
  regex nor clicking "[X]" by text worked), so it covers the lower-left of every screenshot.

## Observations

- **Preloader (seen on mobile at 0.5 s):** dark brown screen, small stepped logo mark, the line
  "I AM A VALLEY OF PEACE / SEE YOU IN THE DREAMS", a sheep made of vertical stripes (video
  `preloader_sheep.mp4`, 0.9 MB) with "57% LOADED", "LOADING THE WEBSITE PLEASE WAIT", and the wordmark
  at the bottom. By the 1.5 s screenshot the hero was showing (desktop first screenshot ≈3 s already showed
  the hero). The hero itself was usable within a few seconds even in software GL.
- **Hero:** full-bleed sunset render of the terraced timber hotel in misty forested mountains. Top bar:
  "≡ MENU", "AEROTOUR" (link to an aerial tour), centred "SON DAVEN" wordmark, "UA", dark pill
  "CONSULTATION". Over the sky: "INVESTMENT PROJECT", a huge wordmark drawn with a stripe/glitch texture,
  "UP TO 10% EXPECTED ANNUAL RETURN", "UP TO 30% CAPITALISATION POTENTIAL" (serif numerals). Bottom-left white
  serif "RESORT DESIGN HOTEL IN YAREMCHE" + small tags; bottom-right a thin circle CTA "INVEST IN SON DAVEN".
- **Story chapters (desktop order):** hero → framed aerial render on tan with a stripe "equaliser" band
  growing from the bottom → "PROLOGUE" quote in large serif on dark brown ("…the Carpathian heritage comes
  alive…") + "DOWNLOAD THE PDF PRESENTATION" → About us / Concept with cut-out terrace renders and a
  video ("SEE YOU IN A DREAM") → "WHERE THE MOUNTAINS SPEAK" location: a dark line map with points of
  interest + a card carousel "6 MIN. WALK TO PROBIY WATERFALL" (2/6, 31/6/5/7/15/5 min.) → a striped
  sun/circle transition → "UNIQUENESS – WHY SON DAVEN CAPTIVATE" with tilted photo cards (yoga, interiors,
  bonfire, kids on rocks) → "CONSTRUCTION TIMELINE" ('26 — '29) → apartments (types Studio / Deluxe /
  Superior / Suite / Family / Penthouse, "FROM 37 M²", feature chips, "INQUIRE ABOUT PRICING", "WATCH THE
  VIDEO") → "FINANCIAL INDICATORS" marquee + a pixel/stripe mountain + figures → developer facts
  ("20+ years", "ranked 2nd … by Forbes Ukraine", "37 completed projects", "7 international property awards")
  → render carousel (1/14) → "BECOME PART OF THE LEGEND" + CONSULTATION → news → FAQ → footer with
  addresses, `tel:+380635101101`, `sale@sondaven.com`.
- **Recurring motif:** vertical stripes of varying height (like a barcode, rain, or woven textile)
  used as transitions, as the texture inside the wordmark, as a sun, a mountain, and the preloader sheep.
- **Navigation:** the top bar is hidden while scrolling the story and shows again at the end; "MENU" opens
  a menu; "CONSULTATION" and the circle "INVEST" CTA reappear in several chapters. No skip link.
- **Type (computed + document.fonts):** `KTF Metro Roman` (serif display, uppercase, tight tracking:
  h1 "6MIN." 96 px −6.1 px; figures 56 px; hero line 40 px white) and `KTF Metro Blueline` (wide
  uppercase sans) for everything else — body paragraphs at **10 px uppercase** with 0.8 px tracking,
  nav 14.4 px. Mobile: big serif 48.75 px, small sans ≈12 px.
- **Colour (computed/pixel):** tan #A89474 (body background), dark brown #2C2824 (text and dark
  bands), white for text over renders. Earthy, two-tone; photos bring green/forest.
- **Reduced motion:** with `reducedMotion: 'reduce'` the sheep preloader still played (desktop
  screenshot at 1.5 s; preloader elements still present at the 9.7 s probe, gone by 17.7 s, under heavy
  CPU load), the stripe transitions, tilted cards and the "pixel mountain" were still drawn while
  scrolling, and the footer ends on a stack of striped sheep. No reduced-motion variant observed.
  This run also added "PROJECT GALLERY" in the captures (same page, different scroll positions).
- **Mobile:** same chapter order and stripe transitions, stacked; menu becomes a hamburger + "UA";
  apartment chips wrap; carousel arrows kept. Not a simplified version.
- **Libraries (evidence, script URLs + globals):** Webflow (`w-mod-js`, webflow.js), GSAP 3.13.0 with
  ScrollTrigger, CustomEase, SplitText (+ Flip 3.14.1), Lenis 1.3.15 (`html.lenis`, `window.Lenis`),
  Barba (page transitions), Swiper 11, jQuery 3.5.1, Finsweet cookie consent, a custom
  `assets.sondaven.com/ActiveFrame.js`, Slater. 16 `<canvas>` elements: one `canvas.scroll-video` and 15
  `canvas.scene` sized to their sections (1440×900 … 1440×2045) — consistent with scroll-scrubbed frame
  sequences / stripe scenes drawn on canvas; no three.js global.
- **Weight:** desktop ≈484 requests, ≈54 MB transferred over the full scroll: images 171 req ≈27.9 MB,
  XHR 80 req ≈16.5 MB, 54 "document" requests ≈3.7 MB (Barba/Webflow page fetches), media ≈5 MB
  (our WebM bodies; original MP4s for the three videos ≈1.2 MB), Cloudflare challenge XHRs repeated.
  Mobile ≈387 requests, ≈32.8 MB.
- **Accessibility:** many `<h1>` (one per "N MIN." figure); body copy 10 px uppercase; focus outline is the
  browser default (`auto 1px`), visible on menu links; "CONSULTATION" had `outline-width 0px`;
  71 images, none missing `alt`; `tel:` and `mailto:` links present.

## Interpretation

- This is the closest of the set to a hotel: it sells **place + atmosphere + rooms** as a sequence —
  arrival (hero), legend (prologue), location (minutes to nature), life there (tilted photo cards),
  rooms (types + area + chips), proof (timeline, figures), invitation (consultation).
- A single graphic motif (stripes) ties loader, transitions, wordmark and data visuals together and
  gives the site a recognisable "texture" without heavy 3D; it is canvas/2D, cheap compared with WebGL scenes.
- Two-tone earthy palette (tan + dark brown) + white over imagery is calm and premium; the serif numerals
  carry hierarchy.
- The 10 px uppercase paragraphs and hidden nav are the price of the look.

## Borrow (for a luxury palace hotel)

1. Chapter order: arrival → story/legend → surroundings (with walking minutes) → experiences →
   rooms & suites (type tabs, size, chips) → booking/consultation.
2. One proprietary motif (pattern from the building/region) reused in loader, dividers and transitions.
3. "N MIN." distance cards with a simple line map instead of an embedded map.
4. Persistent primary CTA ("Consultation"/"Book") + a round secondary CTA over the hero.
5. Short brand-line loader that only plays while assets load.

## Do not carry over

- Investment-return claims and third-party rankings shown without sources (our rule 8: only owner facts).
- 10 px uppercase body text; many h1s; hidden header during the story.
- ≈54 MB / ≈480 requests for one page; cookie panel that does not dismiss.
- CGI renders presented next to real photos without labelling.

## Could not verify

- Awwwards credit/agency; real-GPU smoothness; what "AEROTOUR" contains; menu contents; the video's
  sound; behaviour of the cookie panel's real buttons (our clicks failed).
