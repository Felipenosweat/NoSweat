# JOSHUA'S Magazine: luxury lifestyle magazine with an uppercase serif voice

- Live: https://joshuas.io/ ("For Downtime & Inspiration"), published by WWWonder Ltd
- Award: search result title "JOSHUA'S Magazine - Awwwards Honorable Mention" at
  https://www.awwwards.com/sites/joshuas-magazine; snippet: "JOSHUA'S Magazine (WWWonder) received an Honorable
  Mention, not SOTD, on Feb 19, 2026." The live footer says "BROUGHT TO YOU BY WWWonder" and "WWWONDER Ltd",
  which matches. Loading the award page failed with `net::ERR_CONNECTION_RESET`.
- Method: Playwright, 2026-10-26. Desktop 1440×900, mobile 390×844 and desktop reduced-motion runs, each with
  load/top/scroll/bottom screenshots, computed styles, fonts, network and a 5× Tab focus check. A second pass
  tried to close the newsletter modal, opened the menu and one article ("6 Picks from Art Basel Paris 2026"). A
  third pass scrolled the homepage again; the modal did not appear that time. Screenshots: `shots/joshuas/`.

## Observations

- **Splash:** at 600 ms there is a full-screen maroon card with a gold uppercase serif quote ("THE WILL TO CONQUER
  IS THE FIRST CONDITION OF VICTORY." — FERDINAND FOCH), from `splash-page.js`.
- **Hero:** full-bleed photo with centered h1 "FOR DOWNTIME & INSPIRATION" in cream. The hero photo was different
  on every run (fashion group, still life, a different one on mobile). A "SCROLL TO READ MAGAZINE" ticker runs
  along the bottom. The header has the wordmark at left, a round tree emblem in the centre and "+ Menu" at right.
- **"LATEST":** a story framed by a thin border with notched (scalloped-in) corners, like an engraved card, with
  its title in a 67.5 px uppercase serif.
- **FEATURE chapters:** full-viewport panels (`.sticky-intro`, position sticky, top 0) stack over one another. Each
  has "F E A T U R E" letter-spaced across the full width, the title bottom-left (67.5/67.5 px) and tag pills
  bottom-right (CRAFTSMANSHIP, DESIGN, HOME FEATURES). In some frames the next panel cuts off the title
  mid-line.
- **Further down:** "INSPIRATION FROM AROUND THE WEB" (two rows of curated images moving in opposite directions);
  "STORIES OF INTEREST" with a category filter (ALL, ARCHITECTURE, ART, DESIGN, AUTOMOTIVE, CRAFTSMANSHIP) and a
  mixed-size rounded-card grid with an in-feed ad ("The Art of Brand Design", WWWonder); a footer with Pinterest,
  Instagram and Newsletter in large serif, "COLLAB@JOSHUA.IO", and a full-width "JOSHUA'S" wordmark on a dark image.
- **Newsletter modal** ("SIGN UP TO THE QUIET LIST", glassy gradient, ornamental frame, blurred backdrop)
  appeared after about 5 viewports in the first run and covered every later frame. It did not appear in the third run.
- **Menu:** cream full-screen panel with serif links at 50 px (Topics, All Features, About, Contact), small social
  links, a featured story card with "Read Now" and an inline newsletter field.
- **Article:** hero + centered title (86 px) + "WRITTEN BY HENRY SANSOM · 20 OCT 2026"; an **uppercase serif
  standfirst at 57.6/66.2 px in brown #372213** spanning 1368 px; body BasisGrotesquePro 20/26.7 px in a 720 px
  column (~68 cpl); then one block per gallery: serif h3 41.6 px, 527 px text column (~53 cpl), italic caption, a
  single word set vertically beside the image ("SEMINAL", "PROVOCATIVE", "ELEMENTAL"), and a vertical "PREVIOUS
  ARTICLE" rail on the left edge. The cards use a cream gradient.
- **Type:** only two families. SeasonMix 400 (h1 86.08 px, lh 73.17 px = 0.85, tracking −2.15 px = −0.025em,
  uppercase; mobile 42.5 px) and BasisGrotesquePro 400 (20 px desktop, 16 px mobile). SeasonMix Italic loads,
  but only 14 characters use it.
- **Colour tokens** on `<html style>` from a "day-light-switcher" plugin: `--jsc-dls-current-period: morning`,
  base #F9F4D5, contrast #000, base-neutral #FFF1D4, primary #372213, secondary #C02216. Only the morning values
  were observed.
- **Libraries (evidence):** html class `lenis` and theme script `lenis.min.js?ver=1.2.3`; `swiper@11.0.0`; WordPress
  block theme. There is no window.gsap and no canvas.
- **Accessibility:** the skip link is visible on focus (outline auto). The search input and button have outline none.
  Contrast is high (cream on black 18.9:1, brown on cream 13.5:1). In the reduced-motion run the screenshots looked
  the same, Lenis was still active and 2–4 Web Animations kept running.
- **Performance:** about 11.2 MB and 127 requests on desktop (9.8 MB images, many legacy 300–750 KB JPG/PNG files),
  plus a 3.7 MB GIF on mobile. Fonts total only about 130 KB. reCAPTCHA loads on the homepage.

## Interpretation

- The luxury voice comes from **one uppercase serif with very tight leading** used at few, large sizes over dark,
  warm photography. Discipline (two families, cream/black, brown accent) matters more than effects.
- Sticky full-screen chapters turn a long homepage into "spreads". That is a good way to pace rooms, dining and
  spa sections on a hotel site without any JS animation.
- The vertical single-word labels and the oversized standfirst are print devices that make the article feel
  edited, not templated.
- The modal, splash and random hero work against the calm.

## Borrow

1. Display: uppercase high-contrast serif, `line-height 0.85–1`, `-0.025em`, `clamp(42px, 6vw, 86px)`.
2. Body 20 px grotesk in ~700 px; standfirst as oversized uppercase serif in the accent colour.
3. Sticky stacked chapters (`position: sticky; top: 0; height: 100svh`), each with one image and one title.
4. Letter-spaced section word across the width ("S U I T E S").
5. Notched-corner ornamental frame for one highlighted card.
6. Full-width wordmark footer.

## Do not carry over

- Splash quote and preloader, newsletter modal mid-read, random hero image.
- Heavy legacy images; titles hidden by the next panel.
- Their wordmark, emblem and fonts (SeasonMix/Basis are commercial).

## Not verified

- The award page and agency score.
- How the time-of-day palette changes (only "morning" seen).
- When exactly the modal is triggered (time, scroll depth or session).
- The order of the menu for keyboard users, and whether the tickers pause on focus or hover.
