# Haven Constructions — typographic trade site

- Live: https://www.havenconstructions.com.au/ (custom luxury home builder, Melbourne)
- Award: Awwwards listings (seen only as search snippets) show "Haven Constructions — Honorable Mention,
  Jun 10, 2026, Dobre Agency". **Caveat:** the live site's footer credits "Web design Melbourne jtb", not
  Dobre Agency. We could not open the Awwwards page to check its "visit site" link, so the match between
  this live site and the award is probable but unconfirmed.
- Method: Playwright, desktop 1440×900 + mobile 390×844, 2026-10-14; sequential scroll screenshots,
  computed styles, reduced-motion emulation. No video.

## Observations (what we saw)

- **Hero:** a single giant wordmark "Haven" in deep blue spans the full width (edge to edge with a ~44px
  gutter). Above it, a small square bullet + two-line positioning sentence; below it, "EST. 1990" left and
  "MELBOURNE" right. No photo, no h1 (the page has no `<h1>`; first headings are h2).
- **Header:** logo mark left, a centered grey pill "Menu ≡" (fixed, 64px), "Let's Talk" text link right.
  The pill stays fixed on scroll; logo and "Let's Talk" scroll away.
- **Scroll sequence:** the words "Bespoke" and "Luxury" sit left/right while a small square photo between
  them grows to a large image over several viewports (seen across screenshots 02→04, a sticky
  `ScrollGallery` element confirms pinning). Then a full-bleed interior photo.
- **Content:** "Our guiding values" (h2 47px, letter-spacing −1.9px) with a small square-bulleted label
  ("Philosophy") in a left column and body in a right column; a candid photo of the builder with clients;
  "Featured Projects" with name + year captions ("Calibre 2025", "Obsidian 2025").
- **Footer:** whole viewport turns brand blue; nav list left, "Recently completed" project card right,
  and the giant wordmark repeated in white.
- **Type (computed):** one family everywhere — `fontSuisse` (only "fontSuisse 400" loaded). Body 14.7px /
  22px; h2 47.5px desktop → 28.7px mobile. Hierarchy comes from size alone, one weight.
- **Contact:** `tel:0483987479` and `mailto:` exist but live inside the menu; no form on the homepage.
- **Mobile:** first screen is mostly empty white with the wordmark in the lower half; ~7 swipes before the
  first real content. Menu pill collapses to a "≡" icon.
- **Reduced motion:** with `prefers-reduced-motion: reduce` emulated, the scroll-pinned image sequence
  rendered identically (screenshots match), i.e. not observed to change.
- Smooth-scroll library detected (`html.lenis`).

## Interpretation

- The brand _is_ the type: one family, one weight, extreme scale contrast (wordmark ≈ 400px vs 14px
  body). It feels expensive with almost zero assets — relevant for customers who have few photos.
- Square bullets + two-column "label | text" rows give structure without cards or icons.
- Captions with project name + year are simple, factual proof (fits rule 8: only owner-supplied facts).
- The cost: no clear phone/quote action above the fold, no h1, and a long pinned intro on mobile. For a
  plumber whose goal is "call", this is the wrong trade-off.

## Borrow (principles, not code or branding)

1. Business name as a typographic hero when photos are weak: full-width, single weight, set tight.
2. One family, hierarchy by size and space only; small uppercase meta labels ("EST. 1990", city) at the
   hero corners as quiet facts.
3. "Label | paragraph" two-column rows for values/process sections.
4. Project/service captions as name + year/location, no adjectives.
5. A final full-color brand block footer that restates name, nav and the most recent work.

## Do not carry over

- No h1 and contact hidden in a menu (SEO and conversion loss). Our sites must keep h1 + visible call CTA.
- Multi-viewport scroll-pinned intros, especially on mobile; ignoring reduced-motion.
- Empty first screen on mobile.
- Their wordmark, blue, logo or photography.
