# Studio DADO — a catalogue grid with one warm block at the end

- Live: https://studiodado.com/ (hospitality interior design, Coral Gables, FL).
- Award evidence (search only): WebSearch (extended) returned the page title "Studio Dado - Awwwards SOTD"
  (awwwards.com/sites/studio-dado); the summary gives "SOTD, February 25, 2026", tags Minimal / Clean /
  Gallery and the listing line "A refined website for Studio DADO, a boutique interior design firm shaping
  world class hospitality spaces". No agency in the snippet; no site credit in the live footer. Awwwards is
  unreachable from here.
- Method (2026-10-27): Playwright Chromium, desktop 1440×900 (wheel steps, 8 shots), a slower second desktop
  pass (small wheel steps, a shot every 0.8 viewport), mobile 390×844 (touch, 8 shots), desktop with
  `reducedMotion: "reduce"`, computed styles, `document.fonts`, five Tab presses. Screenshots stayed in the
  scratchpad, not the repo.

## Observation

- **Header:** plain text links spread across the grid in one thin row: "Studio DADO", a four-circle
  monogram, "Projects / Approach / About Us" stacked, "News / Blog" stacked, "Contact" at the right. On
  mobile: monogram + "Menu".
- **Hero:** a full-screen Vimeo MP4 behind the H1 "Form Follows Feeling". The video has no poster; our
  Chromium has no H.264, so the first screen was white with only the header. A real visitor sees the film.
- **Body order:** manifesto in large capitals ("Empathy shapes everything we create…") → two narrow columns
  of body → "FEATURED PROJECTS" with "All projects →" on a hairline → one large photo + three smaller ones
  (AP House Miami, Allura Vista Suite, Serene Spa and Wellness, Grand Atrium), each with a one-line caption:
  name left, category right in grey → blog row (three cards with dates) → black-and-white team photo +
  paragraph + "More about Studio DADO →" → a giant "STUDIO DADO" wordmark → warm brown footer (#5D5346)
  with address, e-mail, phone, sitemap, socials, newsletter.
- **Grid (computed):** 24 columns of 40 px with 19.2 px gaps at 1440 px.
- **Type (computed):** display "disp" uppercase 155.5/124.4 px (−0.02em) for H1/H2, 67.9 px at 390; wordmark
  211 px. Everything else in "sans" 19.2/23 px, weight 400, −0.02em: nav, captions, categories, body.
- **Links:** `tel:7864332500` and `mailto:` in the menu and footer.
- **Motion:** Lenis smooth scroll; photos and text blocks reveal on entry (0.5 s and 1 s transitions). No
  sticky/pinned element. Reduced motion: no difference found.
- **Accessibility:** one H1; all 8 images have empty `alt`; focus outline is the browser default (visible).
- **Mobile:** the same sections stacked; the project grid becomes one column of photos with captions.

## Interpretation

- The calm comes from three restraints: one practical type size, a strict grid with empty columns, and
  captions that read like a catalogue. Nothing on the page asks for attention except the photographs.
- The single warm block at the end works as a "front desk": every fact you need to contact the studio is in
  one place, in a colour taken from the interiors.
- A video-only hero is a risk: no poster means a blank first screen whenever the video fails.

## Borrow

1. One small grotesk size for nav, captions and body (we use ~15–17 px), hierarchy by position and grey.
2. One-line captions under a hairline: name left, kind/place right.
3. Photos at 2–3 sizes on a strict grid, with empty columns kept empty.
4. A warm dark block at the end holding address, phone, e-mail and hours.

## Do not carry over

- Video hero without poster; empty alt on every image; light-grey captions; Lenis; reveals that ignore
  reduced motion; their uppercase display and hospitality photos.

## Not verified

- The hero film content; the project pages; the award score and agency.
