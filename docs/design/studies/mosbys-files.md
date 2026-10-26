# Mosby's Files: archival dossier, three type voices for three content roles

- Live: https://www.mosbyfiles.com/ (research archive on American modernist architects, by Tubik Studio)
- Award: search result title "Mosby's Files - Awwwards SOTD" at https://www.awwwards.com/sites/mosbys-files.
  The snippet said "Site of the Day on August 13, 2026, in the Typography category … nominated for the Typography
  Honors … built by Tubik", and the honors page lists it "among its last winners in typography, dated August 26".
  TopCSSGallery gives a different date and category ("SOTD September 17, 2026 Architecture"), but that is a
  different gallery. Tubik's case study page (loaded) links "Awwwards Site of the Day" to the same URL. The live
  footer says "CRAFTED WITH 🤍 BY TUBIK STUDIO".
- Method: Playwright, 2026-10-26. Desktop, mobile and reduced-motion runs on the home page. Extra pass: hovered a
  tab, clicked "Frank Lloyd Wright" (→ /cases/frank-lloyd-wright), scrolled the case, then switched it to a mobile
  viewport. Paragraph metrics (size, column width, characters per line, `::first-letter`) were measured. Screenshots:
  `shots/mosby/`.

## Observations

- **Home (docH 1,404 px):** a dark page with the masthead "MOSBY'S FILES" and an "About" link. The h1 "AMERICAN
  MODERNISM" is split into 20 `.char` elements, at 144 px, line-height 0.8, uppercase, off-white. Below it sits a
  grey Signifier description (20/28 px). Then comes a **stack of coloured file folders**:
  blue (Frank Lloyd Wright, Irving Gill / "Organic & Early Modernism"), green (Frank Gehry / "Expressive"),
  purple (Louis Kahn, I. M. Pei on a yellow tab, Paul Rudolph on a black tab / "Monumental Modernism") and red
  (Mary Colter, Louis Sullivan / "Contextual & Transitional Architecture"). The red folder is open and shows its
  category text in IBM Plex Mono 12 px. The folder bottom works as the footer: seven wind-rose and compass icons,
  a map scale bar "0 4 8 16 32", "© 2026" and the Tubik credit.
- **Case page:** "FRANK LLOYD WRIGHT" at 120 px. A blue folder holds a **paper sheet with binder holes**: a b/w
  portrait held by a paper clip, then "Born: / Died:" facts in mono 16 px (bold label, regular value), then the
  essay in Signifier **24/33.6 px in a 504 px column (~40 characters per line)** with a **120 px drop cap** (floated
  left, five lines deep). Side tabs on the right lead to the next folders (Irving Gill). Further down is a collage of
  coloured index cards, each with a Founders heading (32 px, "ROBIE HOUSE (1910)", "FALLINGWATER (1935)",
  "GUGGENHEIM MUSEUM, NEW YORK (1959)"), a mono description (18/25.2 px) and archival photos or drawings with paper
  clips, slightly rotated. Then come a video card "An Interview with Frank Lloyd Wright 1958", a yellow "Next →"
  button, a floating hint "Keep scrolling for the next page" and the start of the "IRVING GILL" red folder.
- **Fonts (document.fonts):** Founders Grotesk 700 (file founders-grotesk-x-condensed-bold, 12 KB), Signifier
  400 (file signifier-light, 52 KB), and IBM Plex Mono 400/700 (Google Fonts).
- **Colours:** blue #1E4BD7, red #D71E1E, green #0C7866, purple #581E70, yellow #FFE927, black, off-white #FDFAF7,
  ink #191919.
- **Mobile:** the h1 is 81 px. The folder tabs stack. On the case page the tabs become vertical tabs on the right
  edge, and the essay narrows to **16/22.4 px in a 239 px column**.
- **Libraries (evidence):** html class `lenis`; Nuxt (`/_nuxt/`, one 1 MB chunk); Storyblok CMS
  (api.storyblok.com, a.storyblok.com). There is no window.gsap and no canvas.
- **Accessibility:** the default focus ring is visible on tabs. Contrast: off-white on red 4.93:1, on blue 6.64:1,
  black on yellow 16.9:1, grey description on the dark page about 3.9:1. The home page has a single h1 and no h2.
  The reduced-motion run looked the same.
- **Performance:** about 1.5 MB and 37 requests (the lightest of the five).

## Interpretation

- The physical metaphor does the editorial work: **categories become coloured tabs that are also the navigation**,
  and each person becomes a "file" you can open. Content feels collectible and finite.
- Each typeface has exactly one job: condensed caps for names, serif for the story, mono for facts. That role
  mapping is the transferable typography lesson. It makes even a short essay feel researched.
- The drop cap plus fact block is a classic print opening that suits heritage businesses (a historic hotel:
  "Built: 1898 · Architect: …"), as long as every fact comes from the owner.
- The narrow 504 px / 24 px measure gives a book-like slowness. It suits short essays, not long reading.

## Borrow

1. Type roles: display condensed caps (names), reading serif (story), mono (dates, places, captions).
2. Drop cap (about 5 lines) + `<dl>` fact block to open a heritage or "our story" section.
3. Archival photos as tactile objects (clip, slight rotation) only when the owner supplies real archive images.
4. Tabs-as-navigation for a small set of categories (e.g. suites, dining rooms, event spaces) in muted colours.
5. "Next chapter →" at the end of each story.

## Do not carry over

- The saturated primary palette for luxury; the narrow mobile column; the low-contrast grey intro.
- A home page that says almost nothing before the navigation.
- Their typefaces (Founders and Signifier are commercial), compass icons and scale bar.

## Not verified

- Load and reveal animation of the split h1 (frames not captured), category chevron behaviour, and the About page.
- The award page and score (Awwwards unreachable). The FWA listing was not checked.
