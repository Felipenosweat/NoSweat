# ERA Residential Complex — Art Deco grandeur (midnight & copper)

- Live: https://era.estate/ (English site of the ERA towers by Tekta Group, Moscow; Russian twin era.center)
- Award: agency self-report. LinkedIn snippet (query "videinfra ERA era.center awwwards site of the day"):
  "era.estate has been awarded Site of the Day on Awwwards" (third win after FWA and CSSDA). Vide Infra case
  pages mention CSSDA and FWA SOTD. Award page not found/loaded; date unknown. Note: awwwards.com/sites/era-residence
  seen in search is a different (Marbella) project. Live footer: "WEBSITE BY VIDE INFRA".
- Method: desktop/mobile/reduced runs, Tab test, styles, network. **Limitation:** WebGL renders through
  SwiftShader in this container — screenshots took >20 s and the desktop wheel never advanced the page
  (scrollY stayed 0 in two separate tries). Desktop observations are limited to the first screen; the story
  order comes from the mobile run.

## Observation

- **Desktop first screen:** pill nav — copper MENU, SELECT APARTMENT, VIRTUAL TOUR (left); ERA logo (centre);
  favourites heart, copper REQUEST A CALL, taxi icon (right). H1 "PLACE OF ART" in Decart caps 257px, −5.14px,
  "ART" in copper, over thin sunburst lines; subtitle "THE PLACE WHERE LIFE BECOMES ART"; tower render rising out
  of a sunset sky; floating copper "3D-MAP" card; round scroll button.
- **Mobile order:** hero → "THE NEW ART DECO ERA" → "ARCHITECTURE" (render inside a cream arch) → entrance-arch
  photo → architect quote with circular "ARCHITECTURE" badge → "THE JOY OF EVERY DAY" (neighbourhood, people) →
  3D map → "A TOUCH OF SOPHISTICATION" (landscape) → "INTERIORS" (lobby copy; "5.9 — CEILING HEIGHT, M") →
  "APARTMENTS" → "A NEW ERA FOR THE CITY, A NEW CHAPTER IN YOUR LIFE." → sales office address/hours, round
  "REQUEST A CALL", construction progress, legal footer.
- **Type:** Decart 400 caps (H1 257px/85px mobile; H2 171px/57px; copper statements 57px); Gilroy 500 for UI
  (12px caps, +0.6px) and body.
- **Colour:** midnight #051936, cream #F8F0E8 (15.5:1), copper #CF8F7D (6.6:1 on midnight), #C07863.
- **Persistent actions:** REQUEST A CALL in the desktop header; round copper phone button bottom right on mobile.
- **Reduced motion:** CSS under `(prefers-reduced-motion: reduce), (update: slow)` sets animations to 1 ms and
  makes `[data-reveal]` elements visible — the only site in this set that handles it.
- **Focus:** skip link ("Skip to main content"), 2px cream box-shadow rings on pills.
- **Alt:** 43 of 58 images `alt=""`; an empty `tel:` link next to the real one.
- **Evidence of tech:** 5 `<canvas>` elements; era.center loads `threejs.js`; html classes `has-scroll-smooth
has-scroll-init` (naming used by Locomotive Scroll, but no global found); jQuery. No gsap/Lenis.
- **Weight:** desktop 237 req / ~29.9 MB (images 29.6 MB); mobile 64 / ~4.4 MB (1.85 MB video); LCP 1.16 s.

## Interpretation

- "Royal" opulence through a coherent period language: every motif (sunburst, arch, badge, geometric caps,
  metallic accent) comes from the building's Art Deco style. Ornament is systematic, not decoration.
- Big numerals as facts (ceiling height) read as luxury proof without adjectives.
- The weight and scroll container are unacceptable for small businesses; the visual system is fully
  reproducible without WebGL.

## Borrow

1. Midnight + copper + cream token set for evening/period venues.
2. Giant geometric caps hero with one word in the accent colour.
3. Arch-masked images and a circular rotating badge.
4. Fact numerals ("5.9 m") from owner data.
5. Persistent "Request a call" pill / mobile call FAB.
6. Their reduced-motion CSS approach (neutralise animations, show reveals).

## Do not carry over

- 30 MB home page, WebGL, scroll container; empty alt; untranslated heading ("ИНТЕРЬЕРЫ"); Decart and renders.

## Could not verify

- Desktop scroll story and motion; award page/date; 3D map/tour; hover states.
