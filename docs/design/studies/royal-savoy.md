# Royal Savoy Hotel & Spa Lausanne — heritage grandeur, quiet classic

- Live: https://www.royalsavoy.ch/en (5-star palace hotel, 1909 building, Lake Geneva; The Bürgenstock Collection)
- Award: agency self-report only. Search snippet (ewm.swiss blog): "EWM has earned another Honorable Mention
  from Awwwards, recognizing their exceptional work on the Royal Savoy Hotel & Spa Lausanne website."
  No Awwwards page found or loaded; date unknown. Live footer says "Designed by EWM" (consistent).
- Method: Playwright 2026-10-26, desktop 1440×900 and mobile 390×844 (top, 12–14 wheel steps, footer),
  one run with `reducedMotion: 'reduce'`, Tab ×6, computed styles, request sizes, "Book now" clicked on
  both breakpoints (nothing submitted), fine 300px scroll sequence (`shots/royal-savoy/seq-*.jpg`).

## Observation

- **Arrival:** blank → preloader (black/ivory split panel, logo, a photo, % counter) → hero. LCP measured
  at 7.4 s desktop / 6.2 s mobile (the H1 appears only after the preloader).
- **Hero:** full-screen video (`Video Royal Savoy.mov`; it did not play in our Chromium, so screenshots show
  a grey field), script H1 "Your Exceptional Escape in Lausanne" (Crystal Sky, 128px), white pill booking bar
  (Rooms & Suites | Check in & Check out | Guests). A promo card ("White Truffle & Cantina Lalù") pops up
  bottom-right.
- **Order:** seasonal block "Cosy Autumn Moments" (photo + dated events with dotted rules) → ghost wordmarks
  "ROYAL SAVOY" / "HOTEL & SPA" (Lora 300 uppercase ~152px, #E1DDD7 on #F1F0EB) with 3–4 photos that move at
  different speeds across them → centred welcome copy + blue "Discover More" → Rooms & Suites (script title,
  3-card carousel with m² and view) → Dining → Spa & Wellness (category dropdown + cards) → Meet & Celebrate
  (Meetings / Weddings / Private events, "Inquire now" → /event-inquiry) → Special offers → newsletter →
  footer with address, tel, group and partner logos.
- **Type:** only Lora (body 16/24, nav 14px) and Crystal Sky (script titles 128px desktop / 88px mobile).
- **Colour:** ivory #F1F0EB, #EEECE7, #E1DDD7, text #1F1F1D, preloader #111, one muted blue for "Book now"
  (approx. #4A6F95 from screenshot; not computed).
- **Booking:** desktop "Book now" opens a full-screen ivory "BOOK NOW" panel — "If you have questions or wish
  to make a reservation, you can contact us via phone or email" + phone/email, then four photo tiles: Rooms &
  Suites, Dining, SPA, Offers. Mobile: round blue calendar button in the sticky header opens a dropdown with
  the same four choices.
- **Scroll:** desktop content lives inside a fixed wrapper (document height 900px); header hides on scroll.
- **Reduced motion:** no change seen; 0 `prefers-reduced-motion` rules in readable stylesheets.
- **Focus:** default 1px outline; after scrolling, Tab moved into the hidden header (focused items off-screen).
- **Alt text:** present on all 104 images but mostly camera file names.
- **Libraries:** none detectable (no gsap/Lenis/three/Swiper globals; bundled `app.js`). Utility class names
  in the DOM look like Tailwind.
- **Weight:** 95 requests / ~6.7 MB desktop (1.48 MB PNG menu, 826 KB JPG), 78 / ~5.4 MB mobile; video not counted.

## Interpretation

- The "palace" is told with restraint: ivory, ink, one serif, one script used only for section names. The
  grand gesture is scale (giant script, ghost wordmark), not gold or ornament — which keeps it from feeling
  dated or kitsch.
- The ghost wordmark + moving collage is a cheap, strong brand moment we can generate for any business name.
- The booking overlay that routes by intent and always offers phone/email suits a hotel with many products
  and older guests who prefer to call.
- The preloader and popup cost seconds and attention right where the first impression is formed.

## Borrow

1. Ghost wordmark (business name, huge, ~10% contrast, aria-hidden) behind a 3-photo collage.
2. Script display font only for 1–3-word section titles; one serif for the rest.
3. One "Book" button → intent router + tel/mailto.
4. "This season" block with owner-supplied dated events.

## Do not carry over

- Preloader with counter; promo popup over the hero; .mov hero without poster; file-name alt text;
  hidden-header focus trap; their crest, fonts and photos.

## Could not verify

- The Awwwards page, award date and whether the awarded version is this one.
- Hero video content (did not play), hover states, the external booking engine.
