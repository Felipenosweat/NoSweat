# Monolith Studio: one monument, then an index of artists

- Live: https://monolithstudio.com/ (contemporary tattoo studio, Brooklyn, NYC; Webflow)
- Award (second-hand, Awwwards unreachable): the Abduzeedo article "Monolith Studio: Tattoo Studio Web Design by
  Le:mma" (2026-04-20, loaded with curl) says the site "earned FWA of the Day, Awwwards Site of the Day, and CSS
  Design Awards in the same cycle". A WebSearch summary of the Webflow showcase page says "Awwwards SOTD & DEV,
  CSSDA SOTD". Credit to Artemii Lebedev (Le:mma) comes from a Contra listing in search results. No Awwwards URL
  confirmed.
- Method (2026-10-26): Playwright Chromium headless. Desktop 1440×900 wheel run (9 shots) plus a `scrollTo` run
  (12 shots) because the wheel run stayed inside the pinned intro; mobile 390×844 (9 shots); desktop with
  `reducedMotion: "reduce"` (5 shots); computed styles of h1/h2/h3/nav, `document.fonts`, image alt count, six Tab
  presses, response sizes from `content-length`. Screenshots stayed in the scratchpad (not in the repo).

## Observations

- **Hero:** light grey #E0E0E0 page, black type. "MONOLITH" in SK Modernist 700 at 285 px (−0.05em) spans the
  width; a marble bust stands in front of the letters. Small facts in the corners: "Monolith Studio, contemporary
  tattoo studio based in Brooklyn, NYC", local time "6:20 PM, ET • NYC", "Sound: off", "Keep scrolling".
- **Pinned intro:** the bust stays on screen and turns for about five viewport heights while short texts ("About",
  "Our vision") and black "Sidenote" cards pass. "MEET THE ARTISTS" arrives at 216 px.
- **Artists:** a black section, "Artists" at 61 px, then a grid of black-and-white portraits, four per row. Each
  card: a role tag (Co-Founder, Resident Artist, Resident Guest), the name, the styles in small type ("Fine Line,
  Micro Realism, Black Work") and a "<name>'s bio ↗" button.
- **Rest:** blog cards, Instagram feed, "Collectors say", press, a huge "BOOK EXPERIENCE ↗", footer with the address
  and an index of tattoo styles.
- **Type:** one family, SK Modernist 400/700. Most labels and links are 10–12 px (51 text nodes at 11.52 px).
- **Accessibility:** default focus ring visible on Tab; 33 of 87 images have empty `alt`; no `tel:` or `mailto:` on
  the home page.
- **Reduced motion:** the same pinned bust sequence plays.
- **Weight:** about 14 MB on desktop (2 canvases, 3 videos), 3.5 MB on mobile.
- **Mobile:** "MONOLITH" fits the width, Menu button, artists as a horizontal slider; no horizontal overflow.

## Interpretation

- The site separates mood from information: the monument (word + bust) is pure tone, then the artists are a plain,
  repeatable index. For a roster studio the index is the product.
- Every artist card has the same anatomy (role → name → styles → one action), so a visitor compares styles, not
  layouts.
- Black-and-white portraits make different shoots read as one team.

## Taken for Iron Lotus

- The artist index with a fixed anatomy (number → name → role and style chips → note → price → one action).
- Black-and-white treatment for all photos so stock scenes read as one set.

## Not taken

- The long pinned 3D intro, the dark artists section, the 10–12 px labels, the missing phone link.
