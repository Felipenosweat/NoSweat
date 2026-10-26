# Mat Voyce: kinetic type portfolio built on one variable font

- Live: https://matvoyce.tv/ (UK type designer and animator; footer "Design by Uncommon")
- Award: self-reported. The developer's page https://www.hontran.dev/work/mat-voyce (loaded) says "Key wins:
  Awwwards — Site of the Day (Animations 8.4 / 10) GSAP — Site of the Year 2025 Nominee". A search snippet
  mentions an Awwwards inspiration listing "Desktop by Uncommon PRO from Mat Voyce". No awwwards.com/sites page
  was found, and the good-design.org page did not show the award list the search summary described. Treat this
  as **credible but unconfirmed**.
- Method: Playwright, 2026-10-26. Desktop, mobile and reduced-motion runs as for the other sites. Extra pass:
  8 load frames at 400 ms intervals, font-variation-settings sampled over 2.5 s, mouse moves over the hero letters,
  slow scroll, menu opened. Retried with SwiftShader WebGL flags. Screenshots: `shots/matvoyce/`.

## Observations

- **Preloader:** a giant cyan italic counter ("00", "035", "070" at 0.8–2.8 s).
- **Hero:** "MAT" top-left and "VOYCE" bottom-right, 412.5 px cyan #00D3FF on #FFFEF8, with tiny meta copy
  ("Type designer & animator, working for brands globally." / "UK based · Working globally"), "MENU +" and a lime
  "SCROLL — SCROLL" pill.
- **Variable font, per letter:** each letter is a `.char` element on F37Judge-VF (241 KB, weight 100–900).
  Letters alternate between `"slnt" 500, "wdth" 60, "wght" 1000` and `"slnt" 500, "wdth" 150, "wght" 700`.
  Letter-spacing is −8.25 px (−0.02em) and line-height 0.7. The values did not change at idle or when the mouse
  passed over the letters.
- **Featured work (desktop):** this area rendered **blank** in headless Chromium, even with SwiftShader.
  A 1440×900 canvas exists (`js-has-global-canvas`), so the work is drawn in WebGL. On **mobile** the DOM
  version shows "FEATURED WORK GO!" (sticker heading), the project "OLIPOP TV", ← → buttons and "View project".
- **"What he does":** the active item is black, condensed italic ("TYPE DESIGN & ILLUSTRATION") with
  illustrated stickers (pencil, peace hand, MV). The other items ("TYPE ANIMATION", "MOTION DESIGN") sit
  ghosted grey below.
- **Brands:** two logo rows (Amazon, BBC, Bose, Disney+, ESPN, Google, Lacoste, Netflix, Nike, Oreo, Pepsi,
  Pinterest, Twitch, WhatsApp, YouTube) laid out as marquee rows.
- **Contact:** a giant lime pill, "Always open for new projects and collaborations / CONTACT MAT".
- **Footer:** cyan block with a gradient "MAKING TYPE MOVE" sticker ("SINCE 2020"), WORK/ABOUT/MEDIA and
  INSTAGRAM/BEHANCE/GIPHY/LINKEDIN in large condensed italic, and the email address.
- **Menu:** full screen, "WORK / ABOUT / MEDIA" in large condensed italic, "CONTACT MAT ↗", "CLOSE ×".
- **Grid:** Tailwind classes `grid grid-cols-6 lg:grid-cols-12`, 12 columns × 94 px, 24 px gutters and margins.
- **Other details:** there is a custom cursor (`body {cursor: none}` plus an illustrated arrow element). Link labels
  are doubled per character ("W W O O R R K K" in innerText), a structure for a roll-over swap. Background loops
  run as CSS animations.
- **Accessibility:** there is **no h1** (the only h2 is empty). Tab focus has outline none and no visible
  indicator. The reduced-motion run looked the same: `lenis-smooth` stayed on and the same 4 animations ran.
  Cyan display type on off-white is 1.77:1 and the 32%-black meta text is 2.2:1.
- **Performance:** about 21.9 MB and 99 requests. Images are 20.7 MB, almost all GIFs: menu GIFs of 1.3, 1.6 and
  2.9 MB, a 1.46 MB logo.gif and 0.6–0.8 MB stickers. Fonts are 288 KB.
- **Libraries (evidence):** html classes `lenis lenis-smooth`; Next.js `_next/static`; the canvas has an obtainable
  WebGL context; `window.gsap` is not exposed. The developer says GSAP and WebGL were used.

## Interpretation

- The identity is built from type alone: one variable family covers every voice by changing width, weight and slant.
  This is the clearest example of "type as the image" in this set.
- The extreme scale ratio (display 412 px against 12 px meta, about 34×) carries the drama. Small meta copy placed
  next to the giant word makes the giant word read even bigger.
- It is a portfolio for a motion designer. Most of the cost (GIFs, preloader, WebGL, cursor) is justified for him
  and wrong for a small business.

## Borrow (carefully)

1. Business name as hero type with per-letter variable axes (static, no animation needed), only for short names.
2. Tiny factual meta columns beside giant type.
3. One saturated brand colour for display, a second accent only for the main CTA pill.
4. Oversized "contact" moment near the end.
5. Roll-over link text (two stacked copies, CSS only), off under reduced motion.

## Do not carry over

- Preloader, custom cursor, GIF weight, WebGL-only content, missing h1, invisible focus, low-contrast display colour
  for anything that must be read.
- The F37 Judge typeface (commercial), stickers and brand colours.

## Not verified

- The Awwwards award itself (self-reported).
- Desktop featured-work interactions (WebGL did not render headless).
- Page transitions between routes. Hover effects on the "What he does" items and the menu GIFs were not exercised.
