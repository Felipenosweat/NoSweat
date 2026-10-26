# a-lign studio: Swiss grid, tight grotesk, type that fills as you read

- Live: https://www.a-lign.studio/ (two-person web studio, Slovenia)
- Award: search "a-lign studio awwwards" returned https://www.awwwards.com/sites/a-lign-studio, "Honorable Mention
  dated August 10, 2026". A Typography winners search said "Typography Honors for Aug 2026 for a-lign studio".
  The live site embeds the Awwwards ribbon (`assets.awwwards.com/assets/js/embed_ribbon.js`, a "W. Winner" tab)
  and links "Awwwards" to https://www.awwwards.com/a-lign.studio/. The award page was not loaded.
- Method: Playwright, 2026-10-26. Desktop, mobile and reduced-motion runs (top, ten scroll depths, bottom, focus).
  Extra pass: six load frames at 500 ms steps, an attempt to open the menu (the click timed out) and the "cmd+g grid"
  shortcut. Screenshots: `shots/align/`.

## Observations

- **Load:** a striped pixel wordmark "<a-lign>" with "LOADING 49%" and then "99%". The page then appears as an
  inset card on a dark #1F1F1F frame and zooms to full size (about 1.5 s).
- **Hero:** "Websites that make sense" (Geist Medium 95.65 px, line-height 86 px, tracking −6.2 px = −0.065em)
  centered, with a 16 px uppercase subline and a terracotta "GET ALIGNED" button inside a dashed frame. Three
  founder portraits sit in dashed frames on grid modules, with grey pixel "stairs" and an empty dashed module.
  The visible headline is a `<p>`. The real `<h1>` is `u-sr-only` with SEO text: "Web design and development
  studio. Strategy-first websites for founders and teams."
- **Dock:** a floating bottom bar (MENU, +, "<a>", terracotta CONTACT) is fixed on every screen.
- **Manifesto:** "People deserve better. Better process. Better collaboration. Better results. Without needing a
  bigger team to get there." The text is justified with wide word gaps. Words go from light grey to dark as you
  scroll (scrub), and a small terracotta caps note follows.
- **"Work":** a striped display word (stacked horizontal bars) that fills with terracotta as you scroll. Three
  projects (FEED AGENCY '26, REYOU TREATMENTS '26, THE SYMPHONY '25) sit in dashed boxes, plus "MORE PROJECTS".
- **"Process":** set vertically as striped type beside sticky cards for Strategy / Design / Build. Each card has
  tag chips (DISCOVERY, RESEARCH, SITEMAP…), a tools photo, a paragraph and "FULL PROCESS".
- **Values:** "Craft / Honesty / Partnership" at 154 px, with portraits sliding across the words (text overlay
  layers). Then testimonials (slider with avatar row), "Let's get aligned", and a footer with links, email,
  "cmd+g grid" and a giant faded striped wordmark.
- **Grid (measured):** every major block is a 12-column CSS grid of 85.45 px columns with 31.88 px gutters in a
  1376 px container (32 px margins). `<html>` carries `--col: 85.45px; --gut: 31.875px`. On mobile there are still
  12 columns: `--col 14.42px; --gut 16.67px`.
- **Type:** Geist only (Regular, Medium and Semi Bold files, about 45 KB each). Sizes on desktop: 12, 16, 64, 96
  and 154 px. Everything scales with the viewport: at 390 px the hero is 50.04 px and the body 12.17 px. Tracking
  tightens with size (−0.26 px at 16 px, −6.2 px at 96 px).
- **Colour:** #F7F7F7 / #1F1F1F / #4F4F4F text / terracotta #DE7356 / #D5D5D5 inactive stripes.
- **Libraries (evidence):** `window.gsap` 3.15.0 with ScrollTrigger and SplitText loaded; script URLs for Flip,
  Draggable, CustomEase, Inertia, ScrambleText and ScrollTo; `lenis@1.1.14` (html class lenis); `@barba/core@2.10.3`;
  Swiper 11; hls.js; Webflow.
- **Accessibility:** a skip link, and a **visible 2 px solid outline on every tabbed element** (the best of the five).
  Text contrast is 7.65:1, but **white on terracotta is 2.93:1** (CTA). Body text is 12 px on mobile.
- **Reduced motion:** the layout was identical and no clear difference showed in the captured scrub states.
- **Performance:** about 2.9 MB and 70 requests on desktop, fonts 136 KB.

## Interpretation

- The site feels authored because the **grid is visible**: dashed frames show the modules, and every image and
  label snaps to the same 12 columns. That discipline reads as "Swiss" craft with very little ornament.
- Tracking that tightens as size grows keeps the giant Geist words dense and logo-like.
- The scroll-scrub manifesto is a good single use of motion: it guides reading instead of decorating. Repeated
  everywhere (stripes, sliding images, zoom intro) it becomes busy.

## Borrow

1. Grid tokens `--col` / `--gut` and a 12-column container; dashed or hairline module frames as ornament.
2. One family, size-dependent tracking (about −0.02em at body, −0.06em at display), fluid `clamp()` sizes.
3. A one-line manifesto with scroll fill (GSAP ScrollTrigger scrub), fully visible under reduced motion.
4. A small persistent action dock on mobile and desktop.
5. Process cards with tag chips for service steps.

## Do not carry over

- Preloader and zoom intro; the hidden SEO h1 with a `<p>` as the visual headline.
- 12 px body text on mobile; the low-contrast CTA.
- Striped titles that fill an entire phone screen.

## Not verified

- The menu panel (the click timed out in headless), Barba page transitions, and the effect of the "cmd+g" grid
  overlay (no change seen with Meta+G / Ctrl+G).
- The award score.
